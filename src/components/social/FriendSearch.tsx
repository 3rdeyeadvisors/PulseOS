import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Search, UserPlus, Check, AtSign, BadgeCheck, Mail, Send } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SearchResult {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  verified: boolean | null;
}

interface FriendSearchProps {
  onRequestSent?: () => void;
  sentRequests?: Array<{ receiver_id: string }>;
  friends?: Array<{ friend?: { user_id: string } }>;
}

export function FriendSearch({ onRequestSent, sentRequests: parentSentRequests, friends: parentFriends }: FriendSearchProps) {
  const { user } = useAuth();
  const { sendFriendRequest, friends: hookFriends, sentRequests: hookSentRequests } = useFriends();
  
  // Use parent props if provided, otherwise use hook data
  const friends = parentFriends || hookFriends;
  const sentRequests = parentSentRequests || hookSentRequests;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [searchType, setSearchType] = useState<'username' | 'email'>('username');

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    setSearching(true);
    setResult(null);
    setNotFound(false);

    let data = null;
    let error = null;

    if (searchType === 'username') {
      // Clean the username input (remove @ if present)
      const cleanUsername = searchQuery.trim().toLowerCase().replace(/^@/, '');

      // Search by username
      const response = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url, city, verified')
        .ilike('username', cleanUsername)
        .neq('user_id', user.id)
        .maybeSingle();
      
      data = response.data;
      error = response.error;
    } else {
      // Search by email
      const cleanEmail = searchQuery.trim().toLowerCase();

      const response = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url, city, verified')
        .ilike('email', cleanEmail)
        .neq('user_id', user.id)
        .maybeSingle();
      
      data = response.data;
      error = response.error;
    }

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
      setSearchQuery('');
      onRequestSent?.();
    }
    setSending(false);
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim() || !user) return;

    if (!isValidEmail(inviteEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingInvite(true);

    try {
      // First check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('email', inviteEmail.trim().toLowerCase())
        .maybeSingle();

      if (existingUser) {
        toast.error('This person is already on PulseOS! Try searching for them instead.');
        setSendingInvite(false);
        return;
      }

      // Get current user's profile for the invite
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      const inviterName = profile?.full_name || profile?.email?.split('@')[0] || 'A friend';
      const inviterEmail = profile?.email || user.email || '';

      // Send invite email
      const { error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          inviterName,
          inviterEmail,
          inviteeEmail: inviteEmail.trim(),
        },
      });

      if (error) throw error;

      toast.success('Invite sent successfully!');
      setInviteEmail('');
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invite. Please try again.');
    }

    setSendingInvite(false);
  };

  const isAlreadyFriend = result && friends.some(
    f => f.friend?.user_id === result.user_id
  );

  const hasPendingRequest = result && sentRequests.some(
    r => r.receiver_id === result.user_id
  );

  const getInitials = (name: string | null, uname: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (uname) return uname.slice(0, 2).toUpperCase();
    return '?';
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Find Friends</TabsTrigger>
            <TabsTrigger value="invite">Invite by Email</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button
                variant={searchType === 'username' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSearchType('username');
                  setResult(null);
                  setNotFound(false);
                }}
                className="flex-shrink-0"
              >
                <AtSign className="h-3 w-3 mr-1" />
                Username
              </Button>
              <Button
                variant={searchType === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSearchType('email');
                  setResult(null);
                  setNotFound(false);
                }}
                className="flex-shrink-0"
              >
                <Mail className="h-3 w-3 mr-1" />
                Email
              </Button>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                {searchType === 'username' ? (
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                ) : (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchType === 'username' ? "Search by username..." : "Search by email..."}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {notFound && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No user found with that {searchType}
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
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium">
                        {result.full_name || result.username || 'Unknown User'}
                      </p>
                      {result.verified && (
                        <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500/20" />
                      )}
                    </div>
                    {result.username && (
                      <p className="text-sm text-muted-foreground">@{result.username}</p>
                    )}
                    {result.city && (
                      <p className="text-xs text-muted-foreground">{result.city}</p>
                    )}
                  </div>
                </div>

                {isAlreadyFriend ? (
                  <Button variant="outline" size="sm" disabled>
                    <Check className="h-4 w-4 mr-1" />
                    Friends
                  </Button>
                ) : hasPendingRequest ? (
                  <Button variant="outline" size="sm" disabled>
                    Sent
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleSendRequest} disabled={sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-1" />
                    )}
                    Add
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="invite" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Invite someone to join PulseOS! They'll receive an email invitation.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleInviteByEmail()}
                />
              </div>
              <Button onClick={handleInviteByEmail} disabled={sendingInvite || !inviteEmail.trim()}>
                {sendingInvite ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
