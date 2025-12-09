import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Trophy, Calendar, Zap } from 'lucide-react';
import { useStreak } from '@/hooks/useStreak';
import { Skeleton } from '@/components/ui/skeleton';

export function StreakCard() {
  const { currentStreak, longestStreak, streakBonus, loading } = useStreak();

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-500';
    if (streak >= 14) return 'text-orange-500';
    if (streak >= 7) return 'text-amber-500';
    if (streak >= 3) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return "🔥 Legendary streak!";
    if (streak >= 14) return "🌟 Two week champion!";
    if (streak >= 7) return "⭐ Week warrior!";
    if (streak >= 3) return "💪 Building momentum!";
    if (streak >= 1) return "🚀 Keep it going!";
    return "Start your streak today!";
  };

  const getNextMilestone = (streak: number) => {
    if (streak >= 30) return { days: 0, bonus: 0, label: "Max bonus!" };
    if (streak >= 14) return { days: 30 - streak, bonus: 50, label: "30-day" };
    if (streak >= 7) return { days: 14 - streak, bonus: 35, label: "14-day" };
    if (streak >= 3) return { days: 7 - streak, bonus: 25, label: "7-day" };
    return { days: 3 - streak, bonus: 10, label: "3-day" };
  };

  if (loading) {
    return (
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Activity Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const milestone = getNextMilestone(currentStreak);

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Activity Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Streak Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-4xl font-bold ${getStreakColor(currentStreak)}`}>
              {currentStreak}
            </div>
            <div className="text-sm text-muted-foreground">
              day{currentStreak !== 1 ? 's' : ''}
            </div>
            {currentStreak >= 3 && (
              <Flame className={`h-6 w-6 ${getStreakColor(currentStreak)} animate-pulse`} />
            )}
          </div>
          {streakBonus > 0 && (
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">+{streakBonus} pts</span>
            </div>
          )}
        </div>

        {/* Message */}
        <p className="text-sm text-muted-foreground">{getStreakMessage(currentStreak)}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-sm">
              <span className="font-medium">{longestStreak}</span>
              <span className="text-muted-foreground"> best</span>
            </span>
          </div>
          {milestone.days > 0 ? (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm">
                <span className="font-medium">{milestone.days}</span>
                <span className="text-muted-foreground"> to {milestone.label}</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-500">
                {milestone.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
