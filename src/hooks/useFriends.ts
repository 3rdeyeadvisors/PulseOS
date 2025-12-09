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

    // Fetch friendships where current user is user_id
    const { data: friendshipsAsUser } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        created_at,
        friend:profiles!friendships_friend_id_fkey(user_id, username, full_name, avatar_url, city, verified)
      `)
      .eq('user_id', user.id);

    // Fetch friendships where current user is friend_id
    const { data: friendshipsAsFriend } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        created_at,
        friend:profiles!friendships_user_id_fkey(user_id, username, full_name, avatar_url, city, verified)
      `)
      .eq('friend_id', user.id);

    // Combine and dedupe
    const allFriendships = [
      ...(friendshipsAsUser || []),
      ...(friendshipsAsFriend || []),
    ];

    setFriends(allFriendships as unknown as Friendship[]);
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

    const { data } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        created_at,
        receiver:profiles!friend_requests_receiver_id_fkey(username, full_name, avatar_url, city, verified)
      `)
      .eq('sender_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setSentRequests((data || []) as unknown as FriendRequest[]);
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

    await fetchSentRequests();
    return { error: null };
  };

  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!user) return { error: 'Not authenticated' };

    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) return { error: updateError.message };

    // Create friendship (both directions for easier querying)
    const { error: friendshipError } = await supabase
      .from('friendships')
      .insert([
        { user_id: user.id, friend_id: senderId },
        { user_id: senderId, friend_id: user.id },
      ]);

    if (friendshipError) return { error: friendshipError.message };

    await Promise.all([fetchFriends(), fetchPendingRequests()]);
    return { error: null };
  };

  const declineFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (error) return { error: error.message };

    await fetchPendingRequests();
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
    refreshRequests: fetchPendingRequests,
  };
}
