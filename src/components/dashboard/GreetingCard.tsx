import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';

export function GreetingCard() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();
      
      if (data?.full_name) {
        setFullName(data.full_name.split(' ')[0]); // First name only
      }
    }
    
    fetchProfile();
  }, [user]);

  const displayName = fullName || user?.email?.split('@')[0] || 'there';

  return (
    <div className="col-span-full p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-card to-accent/10 border border-primary/20 shadow-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{greeting}</p>
          <h1 className="text-3xl font-bold">
            {displayName} <span className="text-gradient">✨</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's your personalized overview for today.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
