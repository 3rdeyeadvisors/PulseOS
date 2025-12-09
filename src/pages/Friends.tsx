import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import { Loader2, Users, UserPlus, Send, Inbox, Trophy, Globe, CalendarCheck } from 'lucide-react';

export default function Friends() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { needsUsername, loading: usernameLoading, refreshUsername } = useUsername();
  const { pendingRequests, sentRequests, pendingCount, loading: friendsLoading } = useFriends();
  const { receivedInvites } = useActivityInvites();
  
  const inviteCount = receivedInvites.length;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || usernameLoading) {
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
            <FriendSearch />
          </CardContent>
        </Card>

        <Tabs defaultValue="leaderboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="leaderboard" className="gap-1 px-1">
              <Trophy className="h-4 w-4" />
              <span className="hidden xl:inline">Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-1 px-1">
              <CalendarCheck className="h-4 w-4" />
              <span className="hidden xl:inline">Invites</span>
              {inviteCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {inviteCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-1 px-1">
              <Globe className="h-4 w-4" />
              <span className="hidden xl:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="gap-1 px-1">
              <Users className="h-4 w-4" />
              <span className="hidden xl:inline">Friends</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1 px-1">
              <Inbox className="h-4 w-4" />
              <span className="hidden xl:inline">Requests</span>
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-1 px-1">
              <Send className="h-4 w-4" />
              <span className="hidden xl:inline">Sent</span>
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
                    {pendingRequests.map((request) => (
                      <FriendRequestCard key={request.id} request={request} />
                    ))}
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
                    {sentRequests.map((request) => (
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
                    ))}
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
