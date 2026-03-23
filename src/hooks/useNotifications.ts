import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

type NotificationType = 'welcome' | 'daily_digest' | 'event_reminder' | 'task_reminder' | 'weather_alert' | 'new_recommendation' | 'system';

export function useNotifications() {
  const { user } = useAuth();

  const createNotification = async (
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, string | number | boolean | null | undefined>
  ) => {
    if (!user) return { error: 'Not authenticated' };

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type,
        title,
        message,
        data: data || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return { error: error.message };
    }

    return { data: notification };
  };

  const sendWelcomeEmail = async (email: string, fullName?: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          userId: user.id,
          email,
          fullName,
        },
      });

      if (error) throw error;
      return { data };
    } catch (error: unknown) {
      console.error('Error sending welcome email:', error);
      return { error: getErrorMessage(error) };
    }
  };

  const sendNotificationEmail = async (
    email: string,
    type: 'event_reminder' | 'task_reminder' | 'daily_digest',
    subject: string,
    title: string,
    content: string,
    ctaText?: string,
    ctaUrl?: string
  ) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          userId: user.id,
          email,
          type,
          subject,
          title,
          content,
          ctaText,
          ctaUrl,
        },
      });

      if (error) throw error;
      return { data };
    } catch (error: unknown) {
      console.error('Error sending notification email:', error);
      return { error: getErrorMessage(error) };
    }
  };

  const sendTaskReminder = async (
    taskId: string,
    taskTitle: string,
    dueDate?: string,
    sendEmail: boolean = true
  ) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase.functions.invoke('task-reminders', {
        body: {
          userId: user.id,
          taskId,
          taskTitle,
          dueDate,
          sendEmail,
        },
      });

      if (error) throw error;
      return { data };
    } catch (error: unknown) {
      console.error('Error sending task reminder:', error);
      return { error: getErrorMessage(error) };
    }
  };

  return {
    createNotification,
    sendWelcomeEmail,
    sendNotificationEmail,
    sendTaskReminder,
  };
}
