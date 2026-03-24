import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TaskInvite {
  id: string;
  task_id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  created_at: string;
  task?: {
    id: string;
    title: string;
    completed: boolean;
  };
  sender?: {
    user_id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  receiver?: {
    user_id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useTaskInvites() {
  const { user } = useAuth();
  const [receivedInvites, setReceivedInvites] = useState<TaskInvite[]>([]);
  const [sentInvites, setSentInvites] = useState<TaskInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceivedInvites = useCallback(async () => {
    if (!user) return;

    // First fetch task invites
    const { data: invites, error } = await supabase
      .from('task_invites')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching received task invites:', error);
      return;
    }

    if (!invites || invites.length === 0) {
      setReceivedInvites([]);
      return;
    }

    // Fetch related tasks and sender profiles
    const taskIds = [...new Set(invites.map(i => i.task_id))];
    const senderIds = [...new Set(invites.map(i => i.sender_id))];

    const [tasksResult, profilesResult] = await Promise.all([
      supabase.from('tasks').select('id, title, completed').in('id', taskIds),
      supabase.from('profiles').select('user_id, username, full_name, avatar_url').in('user_id', senderIds)
    ]);

    const enriched = invites.map(invite => ({
      ...invite,
      task: tasksResult.data?.find(t => t.id === invite.task_id),
      sender: profilesResult.data?.find(p => p.user_id === invite.sender_id)
    }));

    setReceivedInvites(enriched as unknown as TaskInvite[]);
  }, [user]);

  const fetchSentInvites = useCallback(async () => {
    if (!user) return;

    // First fetch task invites
    const { data: invites, error } = await supabase
      .from('task_invites')
      .select('*')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sent task invites:', error);
      return;
    }

    if (!invites || invites.length === 0) {
      setSentInvites([]);
      return;
    }

    // Fetch related tasks and receiver profiles
    const taskIds = [...new Set(invites.map(i => i.task_id))];
    const receiverIds = [...new Set(invites.map(i => i.receiver_id))];

    const [tasksResult, profilesResult] = await Promise.all([
      supabase.from('tasks').select('id, title, completed').in('id', taskIds),
      supabase.from('profiles').select('user_id, username, full_name, avatar_url').in('user_id', receiverIds)
    ]);

    const enriched = invites.map(invite => ({
      ...invite,
      task: tasksResult.data?.find(t => t.id === invite.task_id),
      receiver: profilesResult.data?.find(p => p.user_id === invite.receiver_id)
    }));

    setSentInvites(enriched as unknown as TaskInvite[]);
  }, [user]);

  const sendTaskInvite = async (
    taskId: string,
    taskTitle: string,
    receiverId: string,
    message?: string
  ) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Get sender profile
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('user_id', user.id)
        .single();

      const senderName = senderProfile?.full_name || senderProfile?.username || 'A friend';

      // Insert the invite
      const { data: invite, error } = await supabase
        .from('task_invites')
        .insert({
          task_id: taskId,
          sender_id: user.id,
          receiver_id: receiverId,
          message: message || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { error: 'Already invited this friend to this task' };
        }
        throw error;
      }

      // Send email notification
      await supabase.functions.invoke('send-task-invite-email', {
        body: {
          receiverId,
          senderName,
          taskTitle,
          message,
        },
      });

      // Create in-app notification
      await supabase.from('notifications').insert({
        user_id: receiverId,
        type: 'task_reminder',
        title: 'Task Challenge!',
        message: `${senderName} invited you to compete on: ${taskTitle}`,
        data: { taskId, inviteId: invite.id },
      });

      await fetchSentInvites();
      return { data: invite };
    } catch (error: unknown) {
      console.error('Error sending task invite:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const acceptInvite = async (inviteId: string) => {
    if (!user) return;

    // Get the invite details first
    const invite = receivedInvites.find((i) => i.id === inviteId);

    const { error } = await supabase
      .from('task_invites')
      .update({ status: 'accepted' })
      .eq('id', inviteId);

    if (error) {
      console.error('Error accepting task invite:', error);
      toast.error('Failed to accept invite');
      return;
    }

    // Notify the sender that invite was accepted
    if (invite) {
      try {
        // Get receiver profile for notification
        const { data: receiverProfile } = await supabase
          .from('profiles')
          .select('full_name, username')
          .eq('user_id', user.id)
          .single();

        const receiverName = receiverProfile?.full_name || receiverProfile?.username || 'A friend';

        // Create in-app notification for sender
        await supabase.from('notifications').insert([{
          user_id: invite.sender_id,
          type: 'task_reminder' as const,
          title: 'Challenge Accepted!',
          message: `${receiverName} accepted your task challenge: ${invite.task?.title}`,
          data: { taskId: invite.task_id, inviteId },
        }]);
      } catch (err) {
        console.error('Error sending acceptance notification:', err);
      }
    }

    toast.success('Task challenge accepted!');
    await fetchReceivedInvites();
  };

  const declineInvite = async (inviteId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('task_invites')
      .update({ status: 'declined' })
      .eq('id', inviteId);

    if (error) {
      console.error('Error declining task invite:', error);
      toast.error('Failed to decline invite');
      return;
    }

    toast.success('Invite declined');
    await fetchReceivedInvites();
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchReceivedInvites(), fetchSentInvites()]).finally(() =>
        setLoading(false)
      );
    }
  }, [user, fetchReceivedInvites, fetchSentInvites]);

  return {
    receivedInvites,
    sentInvites,
    loading,
    sendTaskInvite,
    acceptInvite,
    declineInvite,
    refreshInvites: () => Promise.all([fetchReceivedInvites(), fetchSentInvites()]),
  };
}
