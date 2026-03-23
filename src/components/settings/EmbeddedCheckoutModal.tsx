import { useCallback, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

interface EmbeddedCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function EmbeddedCheckoutModal({ 
  open, 
  onOpenChange,
  onComplete,
}: EmbeddedCheckoutModalProps) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-checkout', {
        body: { 
          embedded: true,
          return_url: '/settings?tab=subscription'
        }
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to create checkout session');
      }

      if (!data?.clientSecret) {
        throw new Error('No client secret returned');
      }

      return data.clientSecret;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize checkout';
      setError(message);
      throw err;
    }
  }, []);

  const handleComplete = useCallback(() => {
    onComplete?.();
    onOpenChange(false);
  }, [onComplete, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Complete Your Subscription</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <div id="checkout" className="min-h-[400px]">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{
                  fetchClientSecret,
                  onComplete: handleComplete,
                }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
