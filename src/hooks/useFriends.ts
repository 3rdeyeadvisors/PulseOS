import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    verified: boolean | null;
  };
  receiver?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    verified: boolean | null;
  };
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: {
    user_id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    verified: boolean | null;
  };
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchFriends = useCallback(async () => {
    if (!user) return;

    // Since friendships are bidirectional (both A->B and B->A records exist),
    // we only need to query where current user is user_id to get all friends
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        created_at,
        friend:profiles!friendships_friend_id_fkey(user_id, username, full_name, avatar_url, city, verified)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Friends] Failed to fetch friends:', error);
      setFriends([]);
      return;
    }

    // Deduplicate by friend_id to prevent showing same friend twice
    const seen = new Set<string>();
    const uniqueFriendships = (friendships || []).filter((f: any) => {
      if (seen.has(f.friend_id)) return false;
      seen.add(f.friend_id);
      return true;
    });

    setFriends(uniqueFriendships as unknown as Friendship[]);
  }, [user]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        created_at,
        sender:profiles!friend_requests_sender_id_fkey(username, full_name, avatar_url, city, verified)
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setPendingRequests((data || []) as unknown as FriendRequest[]);
    setPendingCount(data?.length || 0);
  }, [user]);

  const fetchSentRequests = useCallback(async () => {
    if (!user) return;

    // First get the friend requests
    const { data: requestsData } = await supabase
      .from('friend_requests')
      .select('id, sender_id, receiver_id, status, created_at')
      .eq('sender_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!requestsData || requestsData.length === 0) {
      setSentRequests([]);
      return;
    }

    // Get receiver profiles separately to avoid RLS join issues
    const receiverIds = requestsData.map(r => r.receiver_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, full_name, avatar_url, city, verified')
      .in('user_id', receiverIds);

    // Combine the data
    const enrichedRequests = requestsData.map(request => ({
      ...request,
      receiver: profilesData?.find(p => p.user_id === request.receiver_id) || null
    }));

    setSentRequests(enrichedRequests as unknown as FriendRequest[]);
  }, [user]);

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
      });

    if (error) {
      if (error.code === '23505') {
        return { error: 'Friend request already sent' };
      }
      return { error: error.message };
    }

    // Get sender's profile for the email
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('user_id', user.id)
      .single();

    // Send email and in-app notification
    try {
      const senderName = senderProfile?.full_name || senderProfile?.username || 'Someone';
      
      // Send email
      await supabase.functions.invoke('send-friend-request-email', {
        body: {
          receiverId,
          senderName,
          senderUsername: senderProfile?.username,
        },
      });

      // Create in-app notification
      await supabase.functions.invoke('create-notification', {
        body: {
          userId: receiverId,
          type: 'system',
          title: 'New Friend Request',
          message: `${senderName} wants to be your friend!`,
          data: { senderId: user.id, senderUsername: senderProfile?.username },
        },
      });
    } catch (notifyError) {
      console.error('Failed to send friend request notifications:', notifyError);
    }

    await fetchSentRequests();
    return { error: null };
  };

  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!user) return { error: 'Not authenticated' };

    console.log('[Friends] Accepting friend request:', { requestId, senderId, userId: user.id });

    // Optimistically remove from pending requests immediately
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    setPendingCount(prev => Math.max(0, prev - 1));

    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) {
      console.error('[Friends] Failed to update request status:', updateError);
      // Revert optimistic update on error
      await fetchPendingRequests();
      return { error: updateError.message };
    }

    console.log('[Friends] Request status updated, creating friendship...');

    // Create friendship using database function (handles both directions)
    const { error: friendshipError } = await supabase
      .rpc('create_friendship', {
        _user_id: user.id,
        _friend_id: senderId,
      });

    if (friendshipError) {
      console.error('[Friends] Failed to create friendship:', friendshipError);
      // Revert the request status if friendship creation fails
      await supabase
        .from('friend_requests')
        .update({ status: 'pending' })
        .eq('id', requestId);
      await fetchPendingRequests();
      return { error: `Failed to create friendship: ${friendshipError.message}` };
    }

    // Verify the friendship was actually created
    const { data: verifyData, error: verifyError } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${senderId}),and(user_id.eq.${senderId},friend_id.eq.${user.id})`)
      .limit(1);

    if (verifyError || !verifyData || verifyData.length === 0) {
      console.error('[Friends] Friendship verification failed:', verifyError || 'No records found');
      // Revert the request status
      await supabase
        .from('friend_requests')
        .update({ status: 'pending' })
        .eq('id', requestId);
      await fetchPendingRequests();
      return { error: 'Friendship was not created. Please try again.' };
    }

    console.log('[Friends] Friendship created and verified successfully');
    await fetchFriends();
    return { error: null };
  };

  const declineFriendRequest = async (requestId: string) => {
    // Optimistically remove from pending requests immediately
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    setPendingCount(prev => Math.max(0, prev - 1));

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (error) {
      // Revert optimistic update on error
      await fetchPendingRequests();
      return { error: error.message };
    }

    return { error: null };
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return { error: 'Not authenticated' };

    // Remove both friendship records
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    if (error) return { error: error.message };

    await fetchFriends();
    return { error: null };
  };

  const cancelFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);

    if (error) return { error: error.message };

    await fetchSentRequests();
    return { error: null };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchFriends(),
        fetchPendingRequests(),
        fetchSentRequests(),
      ]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchFriends, fetchPendingRequests, fetchSentRequests]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    pendingCount,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    cancelFriendRequest,
    refreshFriends: fetchFriends,
    refreshRequests: () => Promise.all([fetchPendingRequests(), fetchSentRequests()]),
  };
}
