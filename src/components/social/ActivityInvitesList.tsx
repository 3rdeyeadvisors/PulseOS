import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useActivityInvites, ActivityInvite } from '@/hooks/useActivityInvites';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  RotateCcw, 
  MapPin,
  Utensils,
  Ticket,
  Film,
  Loader2,
  Send,
  Inbox,
  CalendarCheck,
  ExternalLink,
  Star
} from 'lucide-react';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export function ActivityInvitesList() {
  const { user } = useAuth();
  const { receivedInvites, sentInvites, upcomingPlans, loading, acceptInvite, declineInvite, counterInvite, cancelInvite } = useActivityInvites();
  const [counterModal, setCounterModal] = useState<{ id: string; name: string } | null>(null);
  const [counterDate, setCounterDate] = useState('');
  const [counterTime, setCounterTime] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return <Utensils className="h-4 w-4" />;
      case 'event': return <Ticket className="h-4 w-4" />;
      case 'movie': return <Film className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string | null, username: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (username) return username.slice(0, 2).toUpperCase();
    return '?';
  };

  const handleAccept = async (id: string) => {
    setProcessing(id);
    const { error } = await acceptInvite(id);
    if (error) toast.error(error);
    else toast.success('Invite accepted! Check Upcoming Plans.');
    setProcessing(null);
  };

  const handleDecline = async (id: string) => {
    setProcessing(id);
    const { error } = await declineInvite(id);
    if (error) toast.error(error);
    else toast.success('Invite declined');
    setProcessing(null);
  };

  const handleCounter = async () => {
    if (!counterModal || !counterDate || !counterTime) return;
    
    const dateTime = new Date(`${counterDate}T${counterTime}`);
    if (dateTime <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    setProcessing(counterModal.id);
    const { error } = await counterInvite(counterModal.id, dateTime);
    if (error) toast.error(error);
    else toast.success('Counter-proposal sent!');
    setProcessing(null);
    setCounterModal(null);
    setCounterDate('');
    setCounterTime('');
  };

  const handleCancel = async (id: string) => {
    setProcessing(id);
    const { error } = await cancelInvite(id);
    if (error) toast.error(error);
    else toast.success('Invite cancelled');
    setProcessing(null);
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  const getPartnerInfo = (invite: ActivityInvite) => {
    if (invite.sender_id === user?.id) {
      return invite.receiver;
    }
    return invite.sender;
  };

  const getActivityUrl = (invite: ActivityInvite) => {
    const data = invite.activity_data;
    if (!data) return null;
    return (data['url'] as string) || (data['link'] as string) || (data['ticketUrl'] as string) || null;
  };

  const getActivityDetails = (invite: ActivityInvite) => {
    const data = invite.activity_data;
    if (!data) return null;
    return {
      image: (data['image'] as string) || (data['imageUrl'] as string) || null,
      location: (data['location'] as string) || (data['venue'] as string) || (data['address'] as string) || null,
      rating: (data['rating'] as string) || null,
      price: (data['price'] as string) || (data['priceRange'] as string) || null,
    };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Upcoming Plans - Accepted Invites */}
        {upcomingPlans.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarCheck className="h-5 w-5 text-primary" />
                Upcoming Plans
              </CardTitle>
              <CardDescription>
                Confirmed activities with friends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingPlans.map((invite) => {
                  const partner = getPartnerInfo(invite);
                  const url = getActivityUrl(invite);
                  const details = getActivityDetails(invite);

                  return (
                    <div
                      key={invite.id}
                      className="p-4 rounded-lg border border-border bg-card space-y-3"
                    >
                      {/* Activity header with image if available */}
                      <div className="flex gap-4">
                        {details?.image && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={details.image} 
                              alt={invite.activity_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getActivityIcon(invite.activity_type)}
                            <h4 className="font-semibold truncate">{invite.activity_name}</h4>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={partner?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(partner?.full_name || null, partner?.username || null)}
                              </AvatarFallback>
                            </Avatar>
                            <span>with {partner?.full_name || partner?.username || 'Friend'}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(invite.proposed_time), 'EEE, MMM d')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(invite.proposed_time), 'h:mm a')}
                            </span>
                            {details?.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {details.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      {details?.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{details.location}</span>
                        </div>
                      )}

                      {/* Action buttons */}
                      {url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details / Get Tickets
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Received Invites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Inbox className="h-5 w-5 text-primary" />
              Received Invites
            </CardTitle>
            <CardDescription>
              Activity invites from your friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            {receivedInvites.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No pending invites
              </p>
            ) : (
              <div className="space-y-3">
                {receivedInvites.map((invite) => {
                  const url = getActivityUrl(invite);
                  const details = getActivityDetails(invite);

                  return (
                    <div
                      key={invite.id}
                      className="p-4 rounded-lg border border-border bg-card space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={invite.sender?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(invite.sender?.full_name || null, invite.sender?.username || null)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {invite.sender?.full_name || invite.sender?.username || 'Someone'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              invited you to
                            </p>
                          </div>
                        </div>
                        {invite.status === 'countered' && (
                          <Badge variant="secondary">Counter-Proposal</Badge>
                        )}
                      </div>

                      {/* Activity details with image */}
                      <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                        {details?.image && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={details.image} 
                              alt={invite.activity_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getActivityIcon(invite.activity_type)}
                            <span className="font-medium truncate">{invite.activity_name}</span>
                          </div>
                          {details?.location && (
                            <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {details.location}
                            </p>
                          )}
                          {url && (
                            <Button
                              size="sm"
                              variant="link"
                              className="h-auto p-0 text-xs mt-1"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(invite.counter_time || invite.proposed_time), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(invite.counter_time || invite.proposed_time), 'h:mm a')}
                        </span>
                      </div>

                      {(invite.message || invite.counter_message) && (
                        <p className="text-sm italic text-muted-foreground">
                          "{invite.counter_message || invite.message}"
                        </p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(invite.id)}
                          disabled={processing === invite.id}
                        >
                          {processing === invite.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Accept
                        </Button>
                        {invite.counter_count < 2 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCounterModal({ id: invite.id, name: invite.activity_name })}
                            disabled={processing === invite.id}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Counter
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDecline(invite.id)}
                          disabled={processing === invite.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sent Invites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="h-5 w-5 text-primary" />
              Sent Invites
            </CardTitle>
            <CardDescription>
              Invites you've sent to friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sentInvites.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No pending sent invites
              </p>
            ) : (
              <div className="space-y-3">
                {sentInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {getActivityIcon(invite.activity_type)}
                      </div>
                      <div>
                        <p className="font-medium">{invite.activity_name}</p>
                        <p className="text-sm text-muted-foreground">
                          To: {invite.receiver?.full_name || invite.receiver?.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invite.proposed_time), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancel(invite.id)}
                      disabled={processing === invite.id}
                    >
                      {processing === invite.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Counter Modal */}
      <Dialog open={!!counterModal} onOpenChange={() => setCounterModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Suggest Different Time</DialogTitle>
            <DialogDescription>
              Propose a new time for {counterModal?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                min={today}
                value={counterDate}
                onChange={(e) => setCounterDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={counterTime}
                onChange={(e) => setCounterTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCounterModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleCounter} disabled={!counterDate || !counterTime || !!processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Counter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}