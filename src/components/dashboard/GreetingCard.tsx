import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';

const affirmations = [
  "You are capable of achieving greatness today.",
  "Your energy attracts abundance and positivity.",
  "Today is full of endless possibilities for you.",
  "You are exactly where you need to be right now.",
  "Your presence makes the world a better place.",
  "You have the power to create positive change.",
  "Every step you take leads to growth and wisdom.",
  "Your potential is limitless and ever-expanding.",
  "You radiate confidence, peace, and inner strength.",
  "Today you choose joy, gratitude, and self-love.",
  "You are worthy of all the good coming your way.",
  "Your dreams are valid and within your reach.",
  "You bring light to everyone around you.",
  "Today you embrace your authentic self fully.",
  "You are resilient, strong, and unstoppable.",
  "Your journey is unique and beautifully yours.",
  "You attract success with every positive thought.",
  "Today you release what no longer serves you.",
  "You are growing into your highest self daily.",
  "Your heart is open to receiving all life's blessings.",
  "You trust the timing of your life's unfolding.",
  "Today you honor your needs with compassion.",
  "You are a magnet for miracles and opportunities.",
  "Your mind is clear, focused, and at peace.",
  "You deserve rest, love, and celebration today.",
  "Every challenge you face makes you stronger.",
  "You are loved, valued, and deeply appreciated.",
  "Today you move forward with courage and grace.",
  "Your spirit is unbreakable and ever-glowing.",
  "You are exactly enough, just as you are.",
  "Today you choose to see beauty in everything.",
];

export function GreetingCard() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('');
  const [affirmation, setAffirmation] = useState<string>('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Grand Rising');
    else if (hour < 17) setGreeting('Bright afternoon to you');
    else setGreeting('May your evening be peaceful');

    // Get daily affirmation based on day of year
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const affirmationIndex = dayOfYear % affirmations.length;
    setAffirmation(affirmations[affirmationIndex]);
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
        setFullName(data.full_name.split(' ')[0]);
      }
    }
    
    fetchProfile();
  }, [user]);

  const displayName = fullName || user?.email?.split('@')[0] || 'there';

  return (
    <div className="col-span-full p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-card to-accent/10 border border-primary/20 shadow-glow overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground mb-1">{greeting}</p>
          <h1 className="text-2xl sm:text-3xl font-bold truncate">
            {displayName} <span className="text-gradient">✨</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Here's your personalized overview for today.
          </p>
          <p className="mt-3 text-sm italic text-primary/80 border-l-2 border-primary/30 pl-3">
            "{affirmation}"
          </p>
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-primary/10 border border-primary/20 flex-shrink-0">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
