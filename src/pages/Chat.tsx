import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AISettings {
  aiName: string;
  aiPersonality: string;
  humorLevel: number;
  formalityLevel: number;
}

export default function Chat() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    aiName: 'Pulse',
    aiPersonality: 'balanced',
    humorLevel: 50,
    formalityLevel: 50,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchAISettings() {
      if (!user) return;

      const { data } = await supabase
        .from('preferences')
        .select('ai_name, ai_personality, ai_humor_level, ai_formality_level')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setAiSettings({
          aiName: data.ai_name || 'Pulse',
          aiPersonality: data.ai_personality || 'balanced',
          humorLevel: data.ai_humor_level ?? 50,
          formalityLevel: data.ai_formality_level ?? 50,
        });
      }
    }

    fetchAISettings();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pulse-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages,
            aiName: aiSettings.aiName,
            aiPersonality: aiSettings.aiPersonality,
            humorLevel: aiSettings.humorLevel,
            formalityLevel: aiSettings.formalityLevel,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Add empty assistant message to start streaming into
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, put back and wait for more
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      // Remove the empty assistant message if there was an error
      setMessages((prev) => prev.filter((m) => m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
          <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{aiSettings.aiName}</h1>
            <p className="text-sm text-muted-foreground">Your personal AI assistant</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
                <Sparkles className="h-10 w-10 text-accent" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
              <p className="text-muted-foreground max-w-sm">
                Ask {aiSettings.aiName} anything! Get help with daily planning, recommendations, or just have a chat.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                aiName={aiSettings.aiName}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} isLoading={isLoading} aiName={aiSettings.aiName} />
      </div>
    </AppShell>
  );
}
