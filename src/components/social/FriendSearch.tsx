import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Search, UserPlus, Check, Mail } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';

interface SearchResult {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
}

export function FriendSearch() {
  const { user } = useAuth();
  const { sendFriendRequest, friends, sentRequests } = useFriends();
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSearch = async () => {
    if (!email.trim() || !user) return;

    setSearching(true);
    setResult(null);
    setNotFound(false);

    // Search by email
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, full_name, avatar_url, city')
      .eq('email', email.trim().toLowerCase())
      .neq('user_id', user.id)
      .maybeSingle();

    if (error) {
      toast.error('Error searching for user');
    } else if (data) {
      setResult(data);
    } else {
      setNotFound(true);
    }

    setSearching(false);
  };

  const handleSendRequest = async () => {
    if (!result) return;

    setSending(true);
    const { error } = await sendFriendRequest(result.user_id);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Friend request sent!');
      setResult(null);
      setEmail('');
    }
    setSending(false);
  };

  const isAlreadyFriend = result && friends.some(
    f => f.friend?.user_id === result.user_id
  );

  const hasPendingRequest = result && sentRequests.some(
    r => r.receiver_id === result.user_id
  );

  const getInitials = (name: string | null, username: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (username) return username.slice(0, 2).toUpperCase();
    return '?';
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Search by email address..."
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={searching || !email.trim()}>
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {notFound && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No user found with that email address
          </p>
        )}

        {result && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={result.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(result.full_name, result.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {result.full_name || result.username || 'Unknown User'}
                </p>
                {result.username && (
                  <p className="text-sm text-muted-foreground">@{result.username}</p>
                )}
                {result.city && (
                  <p className="text-xs text-muted-foreground">{result.city}</p>
                )}
              </div>
            </div>

            {isAlreadyFriend ? (
              <Button variant="outline" disabled>
                <Check className="h-4 w-4 mr-2" />
                Friends
              </Button>
            ) : hasPendingRequest ? (
              <Button variant="outline" disabled>
                Request Sent
              </Button>
            ) : (
              <Button onClick={handleSendRequest} disabled={sending}>
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Add Friend
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
