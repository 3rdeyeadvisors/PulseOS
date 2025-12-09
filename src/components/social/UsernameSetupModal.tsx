import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Check, X, AtSign } from 'lucide-react';

interface UsernameSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export function UsernameSetupModal({ open, onComplete }: UsernameSetupModalProps) {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate username format
  const validateUsername = (value: string): string | null => {
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be 20 characters or less';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores allowed';
    if (/^[0-9]/.test(value)) return 'Username cannot start with a number';
    return null;
  };

  // Check username availability with debounce
  useEffect(() => {
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      setIsAvailable(null);
      return;
    }

    setError(null);
    setChecking(true);
    
    const timeoutId = setTimeout(async () => {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (queryError) {
        setError('Error checking availability');
        setIsAvailable(null);
      } else {
        setIsAvailable(data === null);
      }
      setChecking(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSave = async () => {
    if (!user || !isAvailable) return;
    
    setSaving(true);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: username.toLowerCase() })
      .eq('user_id', user.id);

    if (updateError) {
      if (updateError.code === '23505') {
        toast.error('Username already taken');
        setIsAvailable(false);
      } else {
        toast.error('Failed to set username');
      }
    } else {
      toast.success('Username set successfully!');
      onComplete();
    }
    
    setSaving(false);
  };

  const getStatusIcon = () => {
    if (checking) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (error || isAvailable === false) return <X className="h-4 w-4 text-destructive" />;
    if (isAvailable) return <Check className="h-4 w-4 text-green-500" />;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AtSign className="h-5 w-5 text-primary" />
            Choose Your Username
          </DialogTitle>
          <DialogDescription>
            Pick a unique username for the PulseOS community. This is how friends will find you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="your_username"
                className="pl-8 pr-10"
                autoComplete="off"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {getStatusIcon()}
              </span>
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            {!error && isAvailable === true && (
              <p className="text-xs text-green-500">Username is available!</p>
            )}
            {!error && isAvailable === false && (
              <p className="text-xs text-destructive">Username is already taken</p>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 3-20 characters</p>
            <p>• Letters, numbers, and underscores only</p>
            <p>• Cannot start with a number</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSave}
            disabled={!isAvailable || saving || checking}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Confirm Username'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
