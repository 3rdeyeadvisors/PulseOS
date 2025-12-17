import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, Check, Loader2, Calendar, Gift, CreditCard, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const features = [
  'AI-powered personal assistant',
  'Personalized daily recommendations',
  'Weather & news dashboard',
  'Task management with reminders',
  'Food & entertainment suggestions',
  'Social features & leaderboards',
  'All premium modules',
  'Priority support',
];

export function SubscriptionTab() {
  const {
    subscription,
    loading,
    checkoutLoading,
    portalLoading,
    isActive,
    isGrandfathered,
    isTrialing,
    startCheckout,
    openCustomerPortal,
    checkSubscription,
  } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className={isActive ? 'border-primary/50 bg-primary/5' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                <Crown className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {isGrandfathered ? 'Lifetime Access' : isActive ? 'Pulse Life Premium' : 'Free Plan'}
                </CardTitle>
                <CardDescription>
                  {isGrandfathered 
                    ? 'Thank you for being an early supporter!' 
                    : isTrialing 
                    ? '14-day free trial' 
                    : isActive 
                    ? 'Full access to all features' 
                    : 'Upgrade to unlock all features'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isGrandfathered ? 'Grandfathered' : isTrialing ? 'Trial' : isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isGrandfathered && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
              <Gift className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-amber-700 dark:text-amber-300">
                You have lifetime free access as an early adopter. Thank you for your support!
              </span>
            </div>
          )}

          {isTrialing && subscription?.trial_ends_at && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Trial ends on {format(new Date(subscription.trial_ends_at), 'MMMM d, yyyy')}
              </span>
            </div>
          )}

          {isActive && !isGrandfathered && subscription?.subscription_ends_at && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isTrialing ? 'Converts to paid' : 'Renews'} on {format(new Date(subscription.subscription_ends_at), 'MMMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {!isActive && !isGrandfathered && (
              <Button onClick={startCheckout} disabled={checkoutLoading} className="flex-1">
                {checkoutLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Start Free Trial
              </Button>
            )}
            
            {isActive && !isGrandfathered && (
              <Button variant="outline" onClick={openCustomerPortal} disabled={portalLoading}>
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Manage Subscription
              </Button>
            )}

            <Button variant="ghost" onClick={checkSubscription} size="icon" title="Refresh status">
              <Loader2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Card - Only show if not subscribed */}
      {!isActive && !isGrandfathered && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Pulse Life Premium
                </CardTitle>
                <CardDescription>Unlock your full potential</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">$4.99</div>
                <div className="text-sm text-muted-foreground">/month</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <span className="text-sm font-medium text-primary">
                Start with a 14-day free trial — no credit card required until trial ends
              </span>
            </div>

            <div className="grid gap-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Button onClick={startCheckout} disabled={checkoutLoading} className="w-full" size="lg">
              {checkoutLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Crown className="h-4 w-4 mr-2" />
              )}
              Start 14-Day Free Trial
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Features Card - Show for active users */}
      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Premium Features</CardTitle>
            <CardDescription>Everything included in your plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
