import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useChatMessages(userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load message history on mount
  useEffect(() => {
    async function loadMessages() {
      if (!userId) {
        setLoadingHistory(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('role, content')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          setMessages(data as Message[]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadMessages();
  }, [userId]);

  // Save a message to the database
  const saveMessage = useCallback(async (message: Message) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          role: message.role,
          content: message.content,
        });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  }, [userId]);

  // Clear all messages
  const clearMessages = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear messages:', err);
    }
  }, [userId]);

  return {
    messages,
    setMessages,
    loadingHistory,
    saveMessage,
    clearMessages,
  };
}
