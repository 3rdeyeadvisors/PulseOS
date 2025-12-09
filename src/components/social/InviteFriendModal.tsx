import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { useActivityInvites } from '@/hooks/useActivityInvites';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, Send, Users, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface InviteFriendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityType: string;
  activityName: string;
  activityData?: any;
}

export function InviteFriendModal({
  open,
  onOpenChange,
  activityType,
  activityName,
  activityData,
}: InviteFriendModalProps) {
  const { user } = useAuth();
  const { friends, loading: friendsLoading } = useFriends();
  const { sendInvite } = useActivityInvites();
  
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!selectedFriend || !proposedDate || !proposedTime) {
      toast.error('Please select a friend and set a date/time');
      return;
    }

    const dateTime = new Date(`${proposedDate}T${proposedTime}`);
    if (dateTime <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    setSending(true);
    const { error } = await sendInvite(
      selectedFriend,
      activityType,
      activityName,
      activityData,
      dateTime,
      message
    );

    if (error) {
      toast.error(error);
    } else {
      toast.success('Invite sent!');
      onOpenChange(false);
      resetForm();
    }
    setSending(false);
  };

  const resetForm = () => {
    setSelectedFriend(null);
    setProposedDate('');
    setProposedTime('');
    setMessage('');
  };

  const getInitials = (name: string | null, username: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (username) return username.slice(0, 2).toUpperCase();
    return '?';
  };

  // Set minimum date to today
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Invite a Friend
          </DialogTitle>
          <DialogDescription>
            Invite a friend to {activityName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Friend Selection */}
          <div className="space-y-2">
            <Label>Select Friend</Label>
            {friendsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No friends yet. Add friends first!
              </div>
            ) : (
              <ScrollArea className="h-40 rounded-md border">
                <div className="p-2 space-y-1">
                  {friends.map((friendship) => {
                    const friend = friendship.friend;
                    if (!friend) return null;
                    
                    const isSelected = selectedFriend === friend.user_id;
                    
                    return (
                      <button
                        key={friendship.id}
                        onClick={() => setSelectedFriend(friend.user_id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={friend.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(friend.full_name, friend.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate">
                          {friend.full_name || friend.username || 'Unknown'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
              />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Let's check this out together!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedFriend || !proposedDate || !proposedTime || sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
