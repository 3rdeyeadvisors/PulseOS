import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatMessages } from '@/hooks/useChatMessages';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UserContext {
  profile: {
    full_name: string | null;
    city: string | null;
    country: string | null;
    age_range: string | null;
    household_type: string | null;
  } | null;
  preferences: {
    dietary_preferences: string[] | null;
    interests: string[] | null;
    temperature_unit: string | null;
  } | null;
  tasks: Array<{
    title: string;
    completed: boolean;
    due_date: string | null;
  }>;
}

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { preferences, loading: prefsLoading } = usePreferences();
  const initialMessage = (location.state as { initialMessage?: string })?.initialMessage;
  const { messages, setMessages, loadingHistory, saveMessage, clearMessages } = useChatMessages(user?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive AI settings from synced preferences
  const aiSettings = {
    aiName: preferences.ai_name || 'Pulse',
    aiPersonality: preferences.ai_personality || 'balanced',
    humorLevel: preferences.ai_humor_level ?? 50,
    formalityLevel: preferences.ai_formality_level ?? 50,
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, city, country, age_range, household_type')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch recent incomplete tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('title, completed, due_date')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      setUserContext({
        profile: profile || null,
        preferences: {
          dietary_preferences: preferences.dietary_preferences,
          interests: preferences.interests,
          temperature_unit: preferences.temperature_unit,
        },
        tasks: tasks || [],
      });
    }

    fetchUserData();
  }, [user, preferences]);

  // Handle initial message from navigation state
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  useEffect(() => {
    if (initialMessage && !initialMessageSent && userContext && !loadingHistory) {
      setInitialMessageSent(true);
      // Clear the state to prevent re-sending on re-renders
      window.history.replaceState({}, document.title);
      sendMessage(initialMessage);
    }
  }, [initialMessage, initialMessageSent, userContext, loadingHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // Save user message to database
    await saveMessage(userMessage);

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
            userContext,
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

      // Save assistant response to database
      if (assistantContent) {
        await saveMessage({ role: 'assistant', content: assistantContent });
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    await clearMessages();
    toast.success('Chat history cleared');
  };

  if (loading || loadingHistory || prefsLoading) {
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
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{aiSettings.aiName}</h1>
              <p className="text-sm text-muted-foreground">Your personal AI assistant</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
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
