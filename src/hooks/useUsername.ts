import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useUsername() {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkUsername = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking username:', error);
    } else if (data) {
      setUsername(data.username);
      setNeedsUsername(!data.username);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkUsername();
  }, [user]);

  const refreshUsername = () => {
    setLoading(true);
    checkUsername();
  };

  // Allow user to dismiss the prompt without setting a username
  const dismissPrompt = () => {
    setNeedsUsername(false);
  };

  return {
    username,
    needsUsername,
    loading,
    refreshUsername,
    dismissPrompt,
  };
}
