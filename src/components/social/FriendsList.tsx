import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { Loader2, UserMinus, Users } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';

export function FriendsList() {
  const { friends, removeFriend, loading } = useFriends();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null);

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
          Search for friends by their email address to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {friends.map((friendship) => {
          const friend = friendship.friend;
          if (!friend) return null;

          return (
            <div
              key={friendship.id}
              className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage src={friend.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(friend.full_name, friend.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {friend.full_name || friend.username || 'Unknown User'}
                  </p>
                  {friend.username && (
                    <p className="text-sm text-muted-foreground">@{friend.username}</p>
                  )}
                  {friend.city && (
                    <p className="text-xs text-muted-foreground">{friend.city}</p>
                  )}
                </div>
              </div>

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
        })}
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
    </>
  );
}
