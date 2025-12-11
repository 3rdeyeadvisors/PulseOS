import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useCommunity } from '@/hooks/useCommunity';
import { useFriends } from '@/hooks/useFriends';
import { ProfileViewModal } from './ProfileViewModal';
import { toast } from 'sonner';
import { MapPin, UserPlus, Users, Loader2, Globe, BadgeCheck, Search } from 'lucide-react';

export function CommunityDiscovery() {
  const { members, loading, userCity } = useCommunity();
  const { sendFriendRequest } = useFriends();
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter((member) =>
      member.full_name?.toLowerCase().includes(query) ||
      member.username?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const handleSendRequest = async (userId: string) => {
    setSendingTo(userId);
    const { error } = await sendFriendRequest(userId);
    
    if (error) {
      toast.error(error);
    } else {
      toast.success('Friend request sent!');
      setSentRequests(prev => new Set([...prev, userId]));
    }
    setSendingTo(null);
  };

  const getInitials = (name: string | null, username: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (username) return username.slice(0, 2).toUpperCase();
    return '?';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Community
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!userCity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Community
          </CardTitle>
          <CardDescription>
            Discover people in your area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Set Your Location</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your city in Settings → Lifestyle to discover people nearby
            </p>
            <Button variant="outline" asChild>
              <a href="/app/settings">Go to Settings</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Community
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          People in {userCity}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No One Nearby Yet</h3>
            <p className="text-sm text-muted-foreground">
              Be the first in {userCity} to make your profile public, or check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search community..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Scrollable community list */}
            <div className="max-h-[200px] overflow-y-auto">
              <div className="space-y-3">
                {filteredMembers.length === 0 && searchQuery ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No results for "{searchQuery}"
                  </p>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <button
                        onClick={() => setSelectedUserId(member.user_id)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <Avatar className="h-12 w-12 border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(member.full_name, member.username)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium truncate">
                              {member.full_name || member.username || 'Unknown User'}
                            </p>
                            {member.verified && (
                              <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500/20 flex-shrink-0" />
                            )}
                          </div>
                          {member.username && (
                            <p className="text-sm text-muted-foreground truncate">
                              @{member.username}
                            </p>
                          )}
                          {member.interests_public && member.interests && member.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {member.interests.slice(0, 3).map((interest) => (
                                <Badge key={interest} variant="secondary" className="text-xs">
                                  {interest}
                                </Badge>
                              ))}
                              {member.interests.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{member.interests.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </button>

                      {sentRequests.has(member.user_id) ? (
                        <Button variant="outline" size="sm" disabled>
                          Request Sent
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(member.user_id)}
                          disabled={sendingTo === member.user_id}
                        >
                          {sendingTo === member.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <ProfileViewModal
          userId={selectedUserId}
          open={!!selectedUserId}
          onOpenChange={(open) => !open && setSelectedUserId(null)}
        />
      </CardContent>
    </Card>
  );
}
