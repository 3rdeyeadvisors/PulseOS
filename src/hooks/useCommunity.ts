import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CommunityMember {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  interests_public: boolean;
  verified: boolean | null;
  interests?: string[];
}

export function useCommunity() {
  const { user } = useAuth();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState<string | null>(null);

  const fetchUserCity = useCallback(async () => {
    if (!user) return null;

    const { data } = await supabase
      .from('profiles')
      .select('city')
      .eq('user_id', user.id)
      .maybeSingle();

    return data?.city || null;
  }, [user]);

  const fetchCommunityMembers = useCallback(async (city: string | null) => {
    if (!user || !city) {
      setMembers([]);
      setLoading(false);
      return;
    }

    // Get list of current friends to exclude
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id);

    const friendIds = friendships?.map(f => f.friend_id) || [];

    // Get pending friend requests (both sent and received)
    const { data: requests } = await supabase
      .from('friend_requests')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'pending');

    const pendingIds = requests?.flatMap(r => [r.sender_id, r.receiver_id]) || [];

    // Get public profiles in the same city
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, full_name, avatar_url, city, interests_public, verified')
      .eq('profile_public', true)
      .ilike('city', city)
      .neq('user_id', user.id)
      .limit(50);

    if (profiles) {
      // Filter out friends and pending requests
      const excludeIds = [...friendIds, ...pendingIds, user.id];
      const filteredProfiles = profiles.filter(
        p => !excludeIds.includes(p.user_id)
      );

      // Fetch interests for those with public interests
      const membersWithInterests = await Promise.all(
        filteredProfiles.map(async (profile) => {
          if (profile.interests_public) {
            const { data: prefs } = await supabase
              .from('preferences')
              .select('interests')
              .eq('user_id', profile.user_id)
              .maybeSingle();
            
            return {
              ...profile,
              interests: prefs?.interests || [],
            };
          }
          return { ...profile, interests: [] };
        })
      );

      setMembers(membersWithInterests);
    } else {
      setMembers([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const city = await fetchUserCity();
      setUserCity(city);
      await fetchCommunityMembers(city);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchUserCity, fetchCommunityMembers]);

  return {
    members,
    loading,
    userCity,
    refreshMembers: () => fetchCommunityMembers(userCity),
  };
}
