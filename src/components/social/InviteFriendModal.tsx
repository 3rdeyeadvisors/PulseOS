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
import { Loader2, Send, Users, Calendar, Clock, Search, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');

  // Toggle friend selection
  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  // Get selected friend names for display
  const getSelectedFriendNames = () => {
    return selectedFriends.map(id => {
      const friendship = friends.find(f => f.friend?.user_id === id);
      return friendship?.friend?.full_name || friendship?.friend?.username || 'Unknown';
    });
  };

  // Filter friends by search term
  const filteredFriends = friends.filter((friendship) => {
    const friend = friendship.friend;
    if (!friend) return false;
    const searchLower = friendSearch.toLowerCase();
    return (
      friend.full_name?.toLowerCase().includes(searchLower) ||
      friend.username?.toLowerCase().includes(searchLower)
    );
  });

  const handleSend = async () => {
    if (selectedFriends.length === 0 || !proposedDate || !proposedTime) {
      toast.error('Please select at least one friend and set a date/time');
      return;
    }

    const dateTime = new Date(`${proposedDate}T${proposedTime}`);
    if (dateTime <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    setSending(true);
    
    // Send invites to all selected friends
    const results = await Promise.all(
      selectedFriends.map(friendId => 
        sendInvite(
          friendId,
          activityType,
          activityName,
          activityData,
          dateTime,
          message
        )
      )
    );

    const errors = results.filter(r => r.error);
    const successes = results.filter(r => !r.error);

    if (successes.length > 0) {
      toast.success(`Invite${successes.length > 1 ? 's' : ''} sent to ${successes.length} friend${successes.length > 1 ? 's' : ''}!`);
      onOpenChange(false);
      resetForm();
    }
    
    if (errors.length > 0) {
      toast.error(`Failed to send ${errors.length} invite${errors.length > 1 ? 's' : ''}`);
    }
    
    setSending(false);
  };

  const resetForm = () => {
    setSelectedFriends([]);
    setProposedDate('');
    setProposedTime('');
    setMessage('');
    setFriendSearch('');
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
            Invite Friends
          </DialogTitle>
          <DialogDescription>
            Invite friends to {activityName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Friend Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Friends</Label>
              {selectedFriends.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedFriends.length} selected
                </Badge>
              )}
            </div>
            
            {/* Selected friends chips */}
            {selectedFriends.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {getSelectedFriendNames().map((name, idx) => (
                  <Badge 
                    key={selectedFriends[idx]} 
                    variant="outline" 
                    className="bg-primary/10 border-primary/30 pr-1"
                  >
                    {name}
                    <button
                      onClick={() => toggleFriend(selectedFriends[idx])}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
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
              <div className="space-y-2">
                {/* Search input - show when 4+ friends */}
                {friends.length >= 4 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search friends..."
                      value={friendSearch}
                      onChange={(e) => setFriendSearch(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                )}
                <ScrollArea className="h-40 rounded-md border bg-background">
                  <div className="p-2 space-y-1">
                    {filteredFriends.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        No friends match your search
                      </p>
                    ) : (
                      filteredFriends.map((friendship) => {
                        const friend = friendship.friend;
                        if (!friend) return null;
                        
                        const isSelected = selectedFriends.includes(friend.user_id);
                        
                        return (
                          <button
                            key={friendship.id}
                            onClick={() => toggleFriend(friend.user_id)}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                              isSelected 
                                ? 'bg-primary/10 border border-primary/30' 
                                : 'hover:bg-muted border border-transparent'
                            }`}
                          >
                            <div className={`flex items-center justify-center h-5 w-5 rounded border ${
                              isSelected 
                                ? 'bg-primary border-primary' 
                                : 'border-muted-foreground/30'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
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
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
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
            disabled={selectedFriends.length === 0 || !proposedDate || !proposedTime || sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Invite{selectedFriends.length > 1 ? 's' : ''}
            {selectedFriends.length > 1 && ` (${selectedFriends.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
