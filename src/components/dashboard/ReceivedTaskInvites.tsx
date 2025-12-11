import { useState } from 'react';
import { useTaskInvites } from '@/hooks/useTaskInvites';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function ReceivedTaskInvites() {
  const { receivedInvites, loading, acceptInvite, declineInvite } = useTaskInvites();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAccept = async (inviteId: string) => {
    setProcessingIds((prev) => new Set(prev).add(inviteId));
    await acceptInvite(inviteId);
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(inviteId);
      return next;
    });
    // Notify tasks card to refresh
    window.dispatchEvent(new CustomEvent('task-invite-updated'));
  };

  const handleDecline = async (inviteId: string) => {
    setProcessingIds((prev) => new Set(prev).add(inviteId));
    await declineInvite(inviteId);
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(inviteId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (receivedInvites.length === 0) {
    return null; // Don't show the card if there are no invites
  }

  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-muted-foreground">Task Challenges</h3>
        <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
          {receivedInvites.length}
        </span>
      </div>

      <div className="space-y-3">
        {receivedInvites.map((invite) => {
          const isProcessing = processingIds.has(invite.id);
          const senderName =
            invite.sender?.full_name || invite.sender?.username || 'Someone';

          return (
            <div
              key={invite.id}
              className="p-3 rounded-lg bg-secondary/30 border border-border/30"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={invite.sender?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(senderName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{senderName}</span>
                    <span className="text-muted-foreground"> challenged you to:</span>
                  </p>
                  <p className="text-sm font-medium text-primary truncate mt-0.5">
                    {invite.task?.title || 'Unknown task'}
                  </p>
                  {invite.message && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{invite.message}"
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleDecline(invite.id)}
                  disabled={isProcessing}
                >
                  <X className="h-3 w-3 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleAccept(invite.id)}
                  disabled={isProcessing}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Accept
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
