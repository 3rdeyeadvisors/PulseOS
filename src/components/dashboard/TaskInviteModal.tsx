import { useState } from 'react';
import { useFriends } from '@/hooks/useFriends';
import { useTaskInvites } from '@/hooks/useTaskInvites';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Check, X, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface TaskInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
}

export function TaskInviteModal({ open, onOpenChange, taskId, taskTitle }: TaskInviteModalProps) {
  const { friends, loading: friendsLoading } = useFriends();
  const { sendTaskInvite, sentInvites } = useTaskInvites();
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);

  const getInitials = (name: string | null, username: string | null): string => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return '?';
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const filteredFriends = friends.filter(friend => {
    const name = friend.friend?.full_name?.toLowerCase() || '';
    const username = friend.friend?.username?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || username.includes(query);
  });

  // Check if friend already has an invite for this task
  const hasExistingInvite = (friendId: string) => {
    return sentInvites.some(
      invite => invite.task_id === taskId && invite.receiver_id === friendId
    );
  };

  const handleSend = async () => {
    if (selectedFriends.length === 0) {
      toast.error('Please select at least one friend');
      return;
    }

    setSending(true);
    let successCount = 0;
    let errorCount = 0;

    for (const friendId of selectedFriends) {
      const result = await sendTaskInvite(taskId, taskTitle, friendId, message.trim() || undefined);
      if (result.error) {
        console.error(`Failed to invite friend ${friendId}:`, result.error);
        errorCount++;
      } else {
        successCount++;
      }
    }

    setSending(false);

    if (successCount > 0) {
      toast.success(`Invited ${successCount} friend${successCount > 1 ? 's' : ''} to the task!`);
      resetForm();
      onOpenChange(false);
    }

    if (errorCount > 0) {
      toast.error(`Failed to invite ${errorCount} friend${errorCount > 1 ? 's' : ''}`);
    }
  };

  const resetForm = () => {
    setSelectedFriends([]);
    setMessage('');
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Invite Friends to Task
          </DialogTitle>
          <DialogDescription>
            Challenge friends to complete "{taskTitle}" together!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected friends chips */}
          {selectedFriends.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedFriends.map(friendId => {
                const friend = friends.find(f => f.friend_id === friendId);
                const name = friend?.friend?.full_name || friend?.friend?.username || 'Friend';
                return (
                  <div
                    key={friendId}
                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    <span>{name}</span>
                    <button
                      onClick={() => toggleFriend(friendId)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Friends list */}
          <ScrollArea className="h-48 rounded-md border">
            {friendsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Users className="h-8 w-8 mb-2" />
                <p className="text-sm">
                  {searchQuery ? 'No friends found' : 'No friends yet'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredFriends.map(friend => {
                  const isSelected = selectedFriends.includes(friend.friend_id);
                  const alreadyInvited = hasExistingInvite(friend.friend_id);
                  const profile = friend.friend;
                  
                  return (
                    <button
                      key={friend.friend_id}
                      onClick={() => !alreadyInvited && toggleFriend(friend.friend_id)}
                      disabled={alreadyInvited}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        alreadyInvited
                          ? 'opacity-50 cursor-not-allowed bg-muted'
                          : isSelected
                          ? 'bg-primary/10'
                          : 'hover:bg-secondary/50'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(profile?.full_name || null, profile?.username || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">
                          {profile?.full_name || profile?.username || 'Friend'}
                        </p>
                        {profile?.username && profile?.full_name && (
                          <p className="text-xs text-muted-foreground">@{profile.username}</p>
                        )}
                      </div>
                      {alreadyInvited ? (
                        <span className="text-xs text-muted-foreground">Already invited</span>
                      ) : isSelected ? (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Message */}
          <Textarea
            placeholder="Add a message (optional)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="resize-none"
            rows={2}
          />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1"
              disabled={sending || selectedFriends.length === 0}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                `Invite ${selectedFriends.length > 0 ? `(${selectedFriends.length})` : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
