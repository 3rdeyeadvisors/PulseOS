import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { AppShell } from '@/components/layout/AppShell';
import { FriendSearch } from '@/components/social/FriendSearch';
import { FriendRequestCard } from '@/components/social/FriendRequestCard';
import { FriendsList } from '@/components/social/FriendsList';
import { Leaderboard } from '@/components/social/Leaderboard';
import { CommunityDiscovery } from '@/components/social/CommunityDiscovery';
import { ActivityInvitesList } from '@/components/social/ActivityInvitesList';
import { UsernameSetupModal } from '@/components/social/UsernameSetupModal';
import { useUsername } from '@/hooks/useUsername';
import { useFriends } from '@/hooks/useFriends';
import { useActivityInvites } from '@/hooks/useActivityInvites';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Users, UserPlus, Send, Inbox, Trophy, Globe, CalendarCheck, Search, Lock, Crown } from 'lucide-react';

export default function Friends() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading: subscriptionLoading, startCheckout, checkoutLoading } = useSubscription();
  const { needsUsername, loading: usernameLoading, refreshUsername } = useUsername();
  const { pendingRequests, sentRequests, pendingCount, loading: friendsLoading, refreshRequests, friends } = useFriends();
  const { receivedInvites } = useActivityInvites();
  const [requestsSearch, setRequestsSearch] = useState('');
  const [sentSearch, setSentSearch] = useState('');
  
  const inviteCount = receivedInvites.length;

  const filteredPendingRequests = useMemo(() => {
    if (!requestsSearch.trim()) return pendingRequests;
    const query = requestsSearch.toLowerCase();
    return pendingRequests.filter((request) =>
      request.sender?.full_name?.toLowerCase().includes(query) ||
      request.sender?.username?.toLowerCase().includes(query)
    );
  }, [pendingRequests, requestsSearch]);

  const filteredSentRequests = useMemo(() => {
    if (!sentSearch.trim()) return sentRequests;
    const query = sentSearch.toLowerCase();
    return sentRequests.filter((request) =>
      (request as any).receiver?.full_name?.toLowerCase().includes(query) ||
      (request as any).receiver?.username?.toLowerCase().includes(query)
    );
  }, [sentRequests, sentSearch]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || usernameLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Premium paywall for non-subscribers
  if (!isActive) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto flex items-center justify-center min-h-[60vh]">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4 w-fit">
                <Lock className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Premium Feature</CardTitle>
              <CardDescription className="text-base">
                Connect with friends, compete on leaderboards, and send activity invites with Premium.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Build your social network and plan activities together</span>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={startCheckout} disabled={checkoutLoading} size="lg">
                  {checkoutLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Crown className="h-4 w-4 mr-2" />
                  )}
                  Start 14-Day Free Trial
                </Button>
                <Button variant="ghost" onClick={() => navigate('/settings?tab=subscription')}>
                  View Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <UsernameSetupModal 
        open={needsUsername} 
        onComplete={refreshUsername} 
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Friends
          </h1>
          <p className="text-muted-foreground">
            Connect with friends and compete on daily scores
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Friend
            </CardTitle>
            <CardDescription>
              Search for friends by username or email, or invite someone new
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <FriendSearch 
              onRequestSent={refreshRequests} 
              sentRequests={sentRequests}
              friends={friends}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="leaderboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 h-auto gap-0.5 p-1">
            <TabsTrigger value="leaderboard" className="gap-1 px-1 min-h-[44px] flex-col sm:flex-row">
              <Trophy className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs">Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-1 px-1 min-h-[44px] flex-col sm:flex-row relative">
              <CalendarCheck className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs">Invites</span>
              {inviteCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 sm:static sm:ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {inviteCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-1 px-1 min-h-[44px] flex-col sm:flex-row">
              <Globe className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs">Community</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="gap-1 px-1 min-h-[44px] flex-col sm:flex-row">
              <Users className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs">Friends</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1 px-1 min-h-[44px] flex-col sm:flex-row relative">
              <Inbox className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs">Requests</span>
              {pendingCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 sm:static sm:ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-1 px-1 min-h-[44px] flex-col sm:flex-row">
              <Send className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs">Sent</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="invites">
            <ActivityInvitesList />
          </TabsContent>

          <TabsContent value="community">
            <CommunityDiscovery />
          </TabsContent>

          <TabsContent value="friends">
            <Card>
              <CardHeader>
                <CardTitle>Your Friends</CardTitle>
                <CardDescription>
                  People you're connected with on PulseOS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FriendsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Friend Requests</CardTitle>
                <CardDescription>
                  People who want to connect with you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {friendsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No pending requests</h3>
                    <p className="text-sm text-muted-foreground">
                      When someone sends you a friend request, it will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search requests..."
                        value={requestsSearch}
                        onChange={(e) => setRequestsSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Scrollable requests list */}
                    <div className="max-h-[200px] overflow-y-auto">
                      <div className="space-y-3">
                        {filteredPendingRequests.length === 0 && requestsSearch ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No results for "{requestsSearch}"
                          </p>
                        ) : (
                          filteredPendingRequests.map((request) => (
                            <FriendRequestCard key={request.id} request={request} />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent">
            <Card>
              <CardHeader>
                <CardTitle>Sent Requests</CardTitle>
                <CardDescription>
                  Friend requests you've sent that are pending
                </CardDescription>
              </CardHeader>
              <CardContent>
                {friendsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : sentRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No pending sent requests</h3>
                    <p className="text-sm text-muted-foreground">
                      Search for friends above to send a request
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search sent requests..."
                        value={sentSearch}
                        onChange={(e) => setSentSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Scrollable sent requests list */}
                    <div className="max-h-[200px] overflow-y-auto">
                      <div className="space-y-3">
                        {filteredSentRequests.length === 0 && sentSearch ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No results for "{sentSearch}"
                          </p>
                        ) : (
                          filteredSentRequests.map((request) => (
                            <div
                              key={request.id}
                              className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                  <Send className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {(request as any).receiver?.full_name || (request as any).receiver?.username || 'Unknown User'}
                                  </p>
                                  {(request as any).receiver?.username && (
                                    <p className="text-sm text-muted-foreground">
                                      @{(request as any).receiver.username}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge variant="secondary">Pending</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
