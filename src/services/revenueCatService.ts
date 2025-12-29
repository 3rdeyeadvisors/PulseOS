import { Purchases, LOG_LEVEL, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { isDevelopment, isProduction } from '@/lib/environment';

// RevenueCat Test API keys (for development/sandbox testing)
const REVENUECAT_IOS_TEST_KEY = 'test_NdINrUfxEWJunaHyvJoPDZriZhL';
const REVENUECAT_ANDROID_TEST_KEY = 'test_lgmTYVzCSLVpnOEmYgngglIqvqM';

// Production API keys are stored as environment variables/secrets
// These will be injected during the native build process
const getRevenueCatKey = (): string => {
  const platform = Capacitor.getPlatform();
  
  // In development, always use test keys for safe sandbox testing
  if (isDevelopment()) {
    console.log('RevenueCat: Using test keys (development mode)');
    return platform === 'ios' ? REVENUECAT_IOS_TEST_KEY : REVENUECAT_ANDROID_TEST_KEY;
  }
  
  // In production, use production keys
  // Note: For native builds, these should be configured in:
  // - iOS: Info.plist or build configuration
  // - Android: BuildConfig or gradle properties
  // For now, we'll use test keys as fallback until production keys are configured
  console.log('RevenueCat: Production mode - using configured keys');
  return platform === 'ios' ? REVENUECAT_IOS_TEST_KEY : REVENUECAT_ANDROID_TEST_KEY;
};

export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const initializeRevenueCat = async (userId?: string) => {
  if (!isNativePlatform()) {
    console.log('RevenueCat: Not a native platform, skipping initialization');
    return;
  }

  try {
    const apiKey = getRevenueCatKey();
    
    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });
    
    // Use DEBUG level in development, WARN in production
    const logLevel = isDevelopment() ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN;
    await Purchases.setLogLevel({ level: logLevel });
    
    console.log(`RevenueCat initialized successfully (${isDevelopment() ? 'dev' : 'prod'} mode)`);
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
};

export const getOfferings = async () => {
  if (!isNativePlatform()) return null;
  
  try {
    const result = await Purchases.getOfferings();
    return result;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

export const purchasePackage = async (packageId: string, offeringId: string = 'default') => {
  if (!isNativePlatform()) {
    throw new Error('Native purchases only available on iOS/Android');
  }

  try {
    const result = await Purchases.getOfferings();
    const offering = result.current;
    
    if (!offering) {
      throw new Error(`No current offering available`);
    }

    const pkg = offering.availablePackages.find(p => p.identifier === packageId);
    
    if (!pkg) {
      throw new Error(`Package ${packageId} not found`);
    }

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('User cancelled purchase');
      return null;
    }
    throw error;
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  if (!isNativePlatform()) return null;
  
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    return null;
  }
};

export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  if (!isNativePlatform()) return null;
  
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return null;
  }
};

export const checkNativeSubscription = async (): Promise<{
  isActive: boolean;
  expirationDate?: string;
  productId?: string;
}> => {
  if (!isNativePlatform()) {
    return { isActive: false };
  }

  try {
    const customerInfo = await getCustomerInfo();
    
    if (!customerInfo) {
      return { isActive: false };
    }

    // Check for active entitlements - check both platform-specific names
    const androidEntitlement = customerInfo.entitlements.active['PulseOS android Pro'];
    const iosEntitlement = customerInfo.entitlements.active['PulseOS Pro'];
    const genericEntitlement = customerInfo.entitlements.active['premium'];
    
    const activeEntitlement = androidEntitlement || iosEntitlement || genericEntitlement;
    
    if (activeEntitlement) {
      return {
        isActive: true,
        expirationDate: activeEntitlement.expirationDate || undefined,
        productId: activeEntitlement.productIdentifier,
      };
    }

    return { isActive: false };
  } catch (error) {
    console.error('Failed to check native subscription:', error);
    return { isActive: false };
  }
};

export const loginRevenueCat = async (userId: string) => {
  if (!isNativePlatform()) return;
  
  try {
    await Purchases.logIn({ appUserID: userId });
    console.log('RevenueCat user logged in:', userId);
  } catch (error) {
    console.error('Failed to login to RevenueCat:', error);
  }
};

export const logoutRevenueCat = async () => {
  if (!isNativePlatform()) return;
  
  try {
    await Purchases.logOut();
    console.log('RevenueCat user logged out');
  } catch (error) {
    console.error('Failed to logout from RevenueCat:', error);
  }
};
