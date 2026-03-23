import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export interface ActivityInvite {
  id: string;
  sender_id: string;
  receiver_id: string;
  activity_type: string;
  activity_name: string;
  activity_data: Record<string, unknown>;
  proposed_time: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'countered';
  counter_time: string | null;
  counter_message: string | null;
  counter_count: number;
  created_at: string;
  sender?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  receiver?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useActivityInvites() {
  const { user } = useAuth();
  const [receivedInvites, setReceivedInvites] = useState<ActivityInvite[]>([]);
  const [sentInvites, setSentInvites] = useState<ActivityInvite[]>([]);
  const [upcomingPlans, setUpcomingPlans] = useState<ActivityInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceivedInvites = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('activity_invites')
      .select(`
        *,
        sender:profiles!activity_invites_sender_id_fkey(username, full_name, avatar_url)
      `)
      .eq('receiver_id', user.id)
      .in('status', ['pending', 'countered'])
      .order('created_at', { ascending: false });

    setReceivedInvites((data || []) as unknown as ActivityInvite[]);
  }, [user]);

  const fetchSentInvites = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('activity_invites')
      .select(`
        *,
        receiver:profiles!activity_invites_receiver_id_fkey(username, full_name, avatar_url)
      `)
      .eq('sender_id', user.id)
      .in('status', ['pending', 'countered'])
      .order('created_at', { ascending: false });

    setSentInvites((data || []) as unknown as ActivityInvite[]);
  }, [user]);

  const fetchUpcomingPlans = useCallback(async () => {
    if (!user) return;

    // Fetch accepted invites where user is sender or receiver
    const { data } = await supabase
      .from('activity_invites')
      .select(`
        *,
        sender:profiles!activity_invites_sender_id_fkey(user_id, username, full_name, avatar_url),
        receiver:profiles!activity_invites_receiver_id_fkey(user_id, username, full_name, avatar_url)
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .gte('proposed_time', new Date().toISOString())
      .order('proposed_time', { ascending: true });

    setUpcomingPlans((data || []) as unknown as ActivityInvite[]);
  }, [user]);

  const sendInvite = async (
    receiverId: string,
    activityType: string,
    activityName: string,
    activityData: Record<string, unknown>,
    proposedTime: Date,
    message?: string
  ) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('activity_invites')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        activity_type: activityType,
        activity_name: activityName,
        activity_data: activityData as any,
        proposed_time: proposedTime.toISOString(),
        message: message || null,
      });

    if (error) return { error: error.message };

    // Get sender's profile for the email
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('user_id', user.id)
      .single();

    // Send email and in-app notification
    try {
      const senderName = senderProfile?.full_name || senderProfile?.username || 'A friend';
      
      // Send email
      await supabase.functions.invoke('send-activity-invite-email', {
        body: {
          receiverId,
          senderName,
          activityName,
          activityType,
          proposedTime: proposedTime.toISOString(),
          message,
        },
      });

      // Create in-app notification
      await supabase.functions.invoke('create-notification', {
        body: {
          userId: receiverId,
          type: 'system',
          title: 'Activity Invite',
          message: `${senderName} invited you to ${activityName}!`,
          data: { senderId: user.id, activityType, activityName },
        },
      });
    } catch (notifyError: unknown) {
      console.error('Failed to send activity invite notifications:', getErrorMessage(notifyError));
    }

    await fetchSentInvites();
    return { error: null };
  };

  const acceptInvite = async (inviteId: string) => {
    if (!user) return { error: 'Not authenticated' };

    // Get invite details first
    const { data: invite } = await supabase
      .from('activity_invites')
      .select('sender_id, activity_name, activity_type, proposed_time')
      .eq('id', inviteId)
      .single();

    const { error } = await supabase
      .from('activity_invites')
      .update({ status: 'accepted' })
      .eq('id', inviteId);

    if (error) return { error: error.message };

    // Notify the sender that their invite was accepted
    if (invite) {
      try {
        const { data: accepterProfile } = await supabase
          .from('profiles')
          .select('full_name, username')
          .eq('user_id', user.id)
          .single();

        const accepterName = accepterProfile?.full_name || accepterProfile?.username || 'Someone';

        // Send in-app notification
        await supabase.functions.invoke('create-notification', {
          body: {
            userId: invite.sender_id,
            type: 'system',
            title: 'Invite Accepted!',
            message: `${accepterName} accepted your invite to ${invite.activity_name}!`,
            data: { inviteId, activityName: invite.activity_name },
          },
        });

        // Send email notification
        await supabase.functions.invoke('send-invite-accepted-email', {
          body: {
            senderId: invite.sender_id,
            accepterName,
            activityName: invite.activity_name,
            activityType: invite.activity_type,
            proposedTime: invite.proposed_time,
          },
        });
      } catch (notifyError: unknown) {
        console.error('Failed to send acceptance notification:', getErrorMessage(notifyError));
      }
    }

    await Promise.all([fetchReceivedInvites(), fetchUpcomingPlans()]);
    return { error: null };
  };

  const declineInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from('activity_invites')
      .update({ status: 'declined' })
      .eq('id', inviteId);

    if (error) return { error: error.message };

    await fetchReceivedInvites();
    return { error: null };
  };

  const counterInvite = async (inviteId: string, newTime: Date, message?: string) => {
    if (!user) return { error: 'Not authenticated' };

    // Get current invite to check counter count
    const { data: invite } = await supabase
      .from('activity_invites')
      .select('counter_count, sender_id, receiver_id')
      .eq('id', inviteId)
      .single();

    if (!invite) return { error: 'Invite not found' };

    // Check if user can counter (max 1 counter per person)
    const isReceiver = invite.receiver_id === user.id;
    const isSender = invite.sender_id === user.id;
    
    if (invite.counter_count >= 2) {
      return { error: 'Maximum counter-proposals reached. Please send a new invite.' };
    }

    const { error } = await supabase
      .from('activity_invites')
      .update({
        status: 'countered',
        counter_time: newTime.toISOString(),
        counter_message: message || null,
        counter_count: invite.counter_count + 1,
        // Swap sender/receiver for the counter
        sender_id: isReceiver ? invite.receiver_id : invite.sender_id,
        receiver_id: isReceiver ? invite.sender_id : invite.receiver_id,
      })
      .eq('id', inviteId);

    if (error) return { error: error.message };

    await Promise.all([fetchReceivedInvites(), fetchSentInvites()]);
    return { error: null };
  };

  const cancelInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from('activity_invites')
      .delete()
      .eq('id', inviteId);

    if (error) return { error: error.message };

    await fetchSentInvites();
    return { error: null };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchReceivedInvites(), fetchSentInvites(), fetchUpcomingPlans()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchReceivedInvites, fetchSentInvites, fetchUpcomingPlans]);

  return {
    receivedInvites,
    sentInvites,
    upcomingPlans,
    loading,
    sendInvite,
    acceptInvite,
    declineInvite,
    counterInvite,
    cancelInvite,
    refreshInvites: () => Promise.all([fetchReceivedInvites(), fetchSentInvites(), fetchUpcomingPlans()]),
  };
}
