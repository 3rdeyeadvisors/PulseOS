import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  isNativePlatform, 
  checkNativeSubscription, 
  purchasePackage, 
  restorePurchases,
  getOfferings 
} from '@/services/revenueCatService';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export interface SubscriptionStatus {
  subscribed: boolean;
  is_grandfathered: boolean;
  status: string;
  is_trialing?: boolean;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  plan?: string;
  has_stripe_subscription?: boolean;
  is_native?: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [offerings, setOfferings] = useState<unknown>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Check native subscription first if on native platform
    if (isNativePlatform()) {
      try {
        const nativeStatus = await checkNativeSubscription();
        if (nativeStatus.isActive) {
          setSubscription({
            subscribed: true,
            is_grandfathered: false,
            status: 'active',
            subscription_ends_at: nativeStatus.expirationDate,
            plan: nativeStatus.productId,
            is_native: true,
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error checking native subscription:', error);
      }
    }

    // Fall back to Stripe check for web or if no native subscription
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession?.access_token) {
      console.log('No valid session for subscription check, skipping');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        if (!error.message?.includes('Authentication') && !error.message?.includes('missing sub claim')) {
          console.error('Error checking subscription:', error);
        }
        return;
      }

      setSubscription({ ...data as SubscriptionStatus, is_native: false });
    } catch (err) {
      console.error('Error checking subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load native offerings if on native platform
  useEffect(() => {
    const loadOfferings = async () => {
      if (isNativePlatform()) {
        const result = await getOfferings();
        setOfferings(result);
      }
    };
    loadOfferings();
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

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
    
    // Use native purchase if on native platform
    if (isNativePlatform()) {
      try {
        // Use the default offering's monthly package
        const customerInfo = await purchasePackage('$rc_monthly');
        if (customerInfo) {
          toast.success('Subscription successful!');
          await checkSubscription();
        }
      } catch (err: unknown) {
        console.error('Error with native purchase:', err);
        toast.error(getErrorMessage(err));
      } finally {
        setCheckoutLoading(false);
      }
      return;
    }

    // Web: Use Stripe checkout (redirect fallback)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { isTrialing: subscription?.is_trialing ?? false }
      });
      
      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.open(data.url, '_blank');
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

    // Native: No portal, just show info
    if (isNativePlatform()) {
      toast.info('Manage your subscription in your device settings under Subscriptions');
      return;
    }

    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      toast.error('Failed to open subscription management. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!isNativePlatform()) {
      toast.info('Restore is only available on mobile devices');
      return;
    }

    setLoading(true);
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo) {
        await checkSubscription();
        toast.success('Purchases restored successfully');
      }
    } catch (err) {
      console.error('Error restoring purchases:', err);
      toast.error('Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  const isActive = subscription?.subscribed ?? false;
  const isGrandfathered = subscription?.is_grandfathered ?? false;
  const isTrialing = subscription?.is_trialing ?? false;
  const hasStripeSubscription = subscription?.has_stripe_subscription ?? (!!subscription?.subscription_ends_at && !subscription?.is_native);
  const isNative = isNativePlatform();

  return {
    subscription,
    loading,
    checkoutLoading,
    portalLoading,
    isActive,
    isGrandfathered,
    isTrialing,
    hasStripeSubscription,
    isNative,
    offerings,
    checkSubscription,
    startCheckout,
    openCustomerPortal,
    restorePurchases: handleRestorePurchases,
  };
}
