import React, { useState, useMemo, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PulseLogo } from '@/components/ui/pulse-logo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, UserMinus, Users, BadgeCheck, Search } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { supabase } from '@/integrations/supabase/client';
import { ProfileViewModal } from './ProfileViewModal';

function FriendsListComponent() {
  const { friends, removeFriend, loading } = useFriends();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [founderIds, setFounderIds] = useState<Set<string>>(new Set());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch founder status for all friends
  useEffect(() => {
    const fetchFounderStatus = async () => {
      if (friends.length === 0) return;
      const friendUserIds = friends.map(f => f.friend?.user_id).filter(Boolean) as string[];
      if (friendUserIds.length === 0) return;

      const { data } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('user_id', friendUserIds)
        .eq('role', 'admin');

      setFounderIds(new Set(data?.map(r => r.user_id) || []));
    };

    fetchFounderStatus();
  }, [friends]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter((friendship) => {
      const friend = friendship.friend;
      if (!friend) return false;
      return (
        friend.full_name?.toLowerCase().includes(query) ||
        friend.username?.toLowerCase().includes(query) ||
        friend.city?.toLowerCase().includes(query)
      );
    });
  }, [friends, searchQuery]);

  const handleRemove = async () => {
    if (!confirmRemove) return;

    setRemovingId(confirmRemove.id);
    const { error } = await removeFriend(confirmRemove.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Friend removed');
    }
    setRemovingId(null);
    setConfirmRemove(null);
  };

  const getInitials = (name: string | null, username: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (username) return username.slice(0, 2).toUpperCase();
    return '?';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No friends yet</h3>
        <p className="text-sm text-muted-foreground">
          Search for friends by their username to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Scrollable friends list - shows ~2 friends then scrolls */}
        <div className="max-h-[200px] overflow-y-auto">
          <div className="space-y-3">
            {filteredFriends.length === 0 && searchQuery ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No friends match "{searchQuery}"
              </p>
            ) : (
              filteredFriends.map((friendship) => {
                const friend = friendship.friend;
                if (!friend) return null;

                return (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
                  >
                    <button
                      onClick={() => setSelectedUserId(friend.user_id)}
                      className="flex items-center gap-3 text-left"
                    >
                      <Avatar className="h-12 w-12 border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(friend.full_name, friend.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium">
                            {friend.full_name || friend.username || 'Unknown User'}
                          </p>
                          {friend.verified && (
                            <BadgeCheck className="h-4 w-4 text-primary" />
                          )}
                          {founderIds.has(friend.user_id) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex-shrink-0">
                                  <PulseLogo className="h-4 w-4 text-primary" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Pulse Founder</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        {friend.username && (
                          <p className="text-sm text-muted-foreground">@{friend.username}</p>
                        )}
                        {friend.city && (
                          <p className="text-xs text-muted-foreground">{friend.city}</p>
                        )}
                      </div>
                    </button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setConfirmRemove({ 
                        id: friend.user_id, 
                        name: friend.full_name || friend.username || 'this friend' 
                      })}
                      disabled={removingId === friend.user_id}
                    >
                      {removingId === friend.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {confirmRemove?.name}? You'll need to send a new friend request to reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProfileViewModal
        userId={selectedUserId}
        open={!!selectedUserId}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
      />
    </>
  );
}

export const FriendsList = React.memo(FriendsListComponent);
