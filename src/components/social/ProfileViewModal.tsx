import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PulseLogo } from '@/components/ui/pulse-logo';
import { Loader2, MapPin, BadgeCheck, UserPlus, UserMinus, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { toast } from 'sonner';

interface ProfileViewModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileData {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  interests_public: boolean;
  verified?: boolean;
  isFounder?: boolean;
}

export function ProfileViewModal({ userId, open, onOpenChange }: ProfileViewModalProps) {
  const { user } = useAuth();
  const { friends, sentRequests, sendFriendRequest, removeFriend, cancelFriendRequest } = useFriends();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isFriend = friends.some(f => f.friend?.user_id === userId);
  const pendingRequest = sentRequests.find(r => r.receiver_id === userId);
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (!userId || !open) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Use the security definer function to get safe profile data
        const { data, error } = await supabase
          .rpc('get_safe_public_profile', { profile_user_id: userId });

        if (error) throw error;

        if (data && data.length > 0) {
          const profileData = data[0];
          setProfile(profileData);

          // Fetch verified status and founder role in parallel
          const [verifiedResult, roleResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('verified')
              .eq('user_id', userId)
              .maybeSingle(),
            supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', userId)
              .eq('role', 'admin')
              .maybeSingle()
          ]);

          setProfile(prev => prev ? { 
            ...prev, 
            verified: verifiedResult.data?.verified || false,
            isFounder: !!roleResult.data
          } : null);

          // Fetch interests if they're public
          if (profileData.interests_public) {
            const { data: prefsData } = await supabase
              .from('preferences')
              .select('interests')
              .eq('user_id', userId)
              .maybeSingle();

            setInterests(prefsData?.interests || []);
          } else {
            setInterests([]);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Could not load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, open]);

  const handleSendRequest = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await sendFriendRequest(userId);
      toast.success('Friend request sent!');
    } catch (error) {
      toast.error('Failed to send request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest) return;
    setActionLoading(true);
    try {
      await cancelFriendRequest(pendingRequest.id);
      toast.success('Request cancelled');
    } catch (error) {
      toast.error('Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await removeFriend(userId);
      toast.success('Friend removed');
    } catch (error) {
      toast.error('Failed to remove friend');
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name: string | null, username: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (username) return username.slice(0, 2).toUpperCase();
    return '??';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !profile ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>This profile is not available.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar and basic info */}
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials(profile.full_name, profile.username)}
                </AvatarFallback>
              </Avatar>

              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">
                  {profile.full_name || profile.username || 'Unknown User'}
                </h3>
                {profile.isFounder && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <PulseLogo className="h-5 w-5 text-primary" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Pulse Founder</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {profile.verified && !profile.isFounder && (
                  <BadgeCheck className="h-5 w-5 text-primary" />
                )}
              </div>

              {profile.username && profile.full_name && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}

              {(profile.city || profile.state) && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {[profile.city, profile.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Interests */}
            {profile.interests_public && interests.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {!isOwnProfile && (
              <div className="pt-2">
                {isFriend ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleRemoveFriend}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserMinus className="h-4 w-4 mr-2" />
                    )}
                    Remove Friend
                  </Button>
                ) : pendingRequest ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCancelRequest}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Clock className="h-4 w-4 mr-2" />
                    )}
                    Cancel Request
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleSendRequest}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Add Friend
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
