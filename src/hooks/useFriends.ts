import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender?: {
    username: string | null;
    avatar_url: string | null;
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
    const uniqueFriendships = (friendships || []).filter((f: { friend_id: string }) => {
      if (seen.has(f.friend_id)) return false;
      seen.add(f.friend_id);
      return true;
    });

    setFriends(uniqueFriendships as unknown as Friendship[]);
  }, [user]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;

    // Fetch pending requests and current friends in parallel
    const [requestsResult, friendsResult] = await Promise.all([
      supabase
        .from('friend_requests')
        .select('id, sender_id, receiver_id, status, created_at')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
    ]);

    const existingFriendIds = new Set(
      (friendsResult.data || []).map(f => f.friend_id)
    );

    // Filter out requests from users who are already friends
    const filteredRequests = (requestsResult.data || []).filter(
      req => !existingFriendIds.has(req.sender_id)
    );

    // Fetch sender profiles using the secure RPC function for each request
    const enrichedRequests = await Promise.all(
      filteredRequests.map(async (request) => {
        const { data: senderProfile } = await supabase
          .rpc('get_friend_request_sender_profile', { sender_user_id: request.sender_id });
        
        return {
          ...request,
          sender: senderProfile && senderProfile.length > 0 ? {
            username: senderProfile[0].username,
            avatar_url: senderProfile[0].avatar_url,
            verified: senderProfile[0].verified,
          } : null
        };
      })
    );

    setPendingRequests(enrichedRequests as unknown as FriendRequest[]);
    setPendingCount(enrichedRequests.length);
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
    } catch (notifyError: unknown) {
      console.error('Failed to send friend request notifications:', getErrorMessage(notifyError));
    }

    await fetchSentRequests();
    return { error: null };
  };

  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!user) return { error: 'Not authenticated' };

    // Find the request to get sender info for optimistic update
    const request = pendingRequests.find(r => r.id === requestId);
    
    // Optimistically remove from pending requests immediately
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    setPendingCount(prev => Math.max(0, prev - 1));

    // Optimistically add the new friend to the friends list
    if (request?.sender) {
      const optimisticFriend: Friendship = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        friend_id: senderId,
        created_at: new Date().toISOString(),
        friend: {
          user_id: senderId,
          username: request.sender.username,
          full_name: null, // Not available from friend request (privacy)
          avatar_url: request.sender.avatar_url,
          city: null, // Not available from friend request (privacy)
          verified: request.sender.verified,
        },
      };
      setFriends(prev => [...prev, optimisticFriend]);
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) {
      console.error('[Friends] Failed to update request status:', updateError);
      // Revert optimistic updates on error
      fetchPendingRequests();
      fetchFriends();
      return { error: updateError.message };
    }

    // Create friendship using database function (handles both directions)
    const { error: friendshipError } = await supabase
      .rpc('create_friendship', {
        _user_id: user.id,
        _friend_id: senderId,
      });

    if (friendshipError) {
      console.error('[Friends] Failed to create friendship:', friendshipError);
      // Revert the request status if friendship creation fails
      supabase
        .from('friend_requests')
        .update({ status: 'pending' })
        .eq('id', requestId);
      fetchPendingRequests();
      fetchFriends();
      return { error: `Failed to create friendship: ${friendshipError.message}` };
    }

    // Refresh friends list in background to get proper IDs (non-blocking)
    fetchFriends();
    
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
