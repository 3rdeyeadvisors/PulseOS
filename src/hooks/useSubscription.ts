import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SubscriptionStatus {
  subscribed: boolean;
  is_grandfathered: boolean;
  status: string;
  is_trialing?: boolean;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  plan?: string;
  has_stripe_subscription?: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Ensure we have a valid session before calling
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession?.access_token) {
      console.log('No valid session for subscription check, skipping');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        // Don't log auth errors as they're expected during session transitions
        if (!error.message?.includes('Authentication') && !error.message?.includes('missing sub claim')) {
          console.error('Error checking subscription:', error);
        }
        return;
      }

      setSubscription(data as SubscriptionStatus);
    } catch (err) {
      console.error('Error checking subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Refresh subscription status periodically (every 60 seconds)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const startCheckout = async () => {
    if (!session) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      toast.error('Please sign in to manage your subscription');
      return;
    }

    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      toast.error('Failed to open subscription management. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const isActive = subscription?.subscribed ?? false;
  const isGrandfathered = subscription?.is_grandfathered ?? false;
  const isTrialing = subscription?.is_trialing ?? false;
  // Has Stripe subscription if subscription_ends_at is present (not just database trial)
  const hasStripeSubscription = !!subscription?.subscription_ends_at;

  return {
    subscription,
    loading,
    checkoutLoading,
    portalLoading,
    isActive,
    isGrandfathered,
    isTrialing,
    hasStripeSubscription,
    checkSubscription,
    startCheckout,
    openCustomerPortal,
  };
}
