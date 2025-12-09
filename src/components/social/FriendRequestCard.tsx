import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Check, X, BadgeCheck } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { formatDistanceToNow } from 'date-fns';

interface FriendRequestCardProps {
  request: {
    id: string;
    sender_id: string;
    created_at: string;
    sender?: {
      username: string | null;
      full_name: string | null;
      avatar_url: string | null;
      city: string | null;
      verified: boolean | null;
    };
  };
}

export function FriendRequestCard({ request }: FriendRequestCardProps) {
  const { acceptFriendRequest, declineFriendRequest } = useFriends();
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    const { error } = await acceptFriendRequest(request.id, request.sender_id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Friend request accepted!');
    }
    setAccepting(false);
  };

  const handleDecline = async () => {
    setDeclining(true);
    const { error } = await declineFriendRequest(request.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Friend request declined');
    }
    setDeclining(false);
  };

  const getInitials = () => {
    const name = request.sender?.full_name;
    const username = request.sender?.username;
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (username) return username.slice(0, 2).toUpperCase();
    return '?';
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
      <Avatar className="h-10 w-10 border border-border flex-shrink-0">
        <AvatarImage src={request.sender?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium truncate max-w-[140px]">
            {request.sender?.full_name || request.sender?.username || 'Unknown User'}
          </p>
          {request.sender?.verified && (
            <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500/20 flex-shrink-0" />
          )}
        </div>
        {request.sender?.username && (
          <p className="text-sm text-muted-foreground truncate max-w-[140px]">
            @{request.sender.username}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
        </p>
      </div>

      <div className="flex gap-1.5 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={handleDecline}
          disabled={declining || accepting}
        >
          {declining ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="sm"
          className="h-8 px-3"
          onClick={handleAccept}
          disabled={accepting || declining}
        >
          {accepting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
