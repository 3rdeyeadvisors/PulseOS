import React, { useState, useMemo, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PulseLogo } from '@/components/ui/pulse-logo';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { ProfileViewModal } from './ProfileViewModal';
import { Trophy, Medal, Award, Crown, TrendingUp, Users, BadgeCheck, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function LeaderboardComponent() {
  const { leaderboard, weeklyStats, loading, currentWeek } = useLeaderboard();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const query = searchQuery.toLowerCase();
    return leaderboard.filter((entry) => 
      entry.full_name?.toLowerCase().includes(query) ||
      entry.username?.toLowerCase().includes(query)
    );
  }, [leaderboard, searchQuery]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 2:
        return 'bg-gray-400/10 text-gray-400 border-gray-400/30';
      case 3:
        return 'bg-amber-600/10 text-amber-600 border-amber-600/30';
      default:
        return '';
    }
  };

  const getInitials = (name: string | null, username: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (username) return username.slice(0, 2).toUpperCase();
    return '?';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Weekly Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Weekly Leaderboard
        </CardTitle>
        <CardDescription>
          {format(currentWeek.start, 'MMM d')} - {format(currentWeek.end, 'MMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Your Weekly Stats */}
        {weeklyStats && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Your Week</span>
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {weeklyStats.total_score} pts
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold">{weeklyStats.tasks_completed}</p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </div>
              <div>
                <p className="text-lg font-bold">{weeklyStats.recommendations_tried}</p>
                <p className="text-xs text-muted-foreground">Tried</p>
              </div>
              <div>
                <p className="text-lg font-bold">{weeklyStats.streak_days}</p>
                <p className="text-xs text-muted-foreground">Days Active</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Competition Yet</h3>
            <p className="text-sm text-muted-foreground">
              Add friends to compete on the weekly leaderboard!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leaderboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Scrollable leaderboard list */}
            <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <div className="space-y-2">
                {filteredLeaderboard.length === 0 && searchQuery ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No results for "{searchQuery}"
                  </p>
                ) : (
                  filteredLeaderboard.map((entry) => (
                    <button
                      key={entry.user_id}
                      onClick={() => setSelectedUserId(entry.user_id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg transition-colors w-full text-left',
                        entry.isCurrentUser 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-muted/30 hover:bg-muted/50',
                        entry.rank <= 3 && getRankBadgeClass(entry.rank)
                      )}
                    >
                      <div className="w-8 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      
                      <Avatar className="h-10 w-10 border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(entry.full_name, entry.username)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={cn(
                            'font-medium truncate',
                            entry.isCurrentUser && 'text-primary'
                          )}>
                            {entry.full_name || entry.username || 'Unknown'}
                            {entry.isCurrentUser && ' (You)'}
                          </p>
                          {entry.verified && (
                            <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          {entry.isFounder && (
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
                        {entry.username && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{entry.username}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold">{entry.total_score}</p>
                        <p className="text-xs text-muted-foreground">pts</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <ProfileViewModal
          userId={selectedUserId}
          open={!!selectedUserId}
          onOpenChange={(open) => !open && setSelectedUserId(null)}
        />
      </CardContent>
    </Card>
  );
}

export const Leaderboard = React.memo(LeaderboardComponent);
