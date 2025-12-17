import { Purchases, LOG_LEVEL, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// RevenueCat API keys
const REVENUECAT_IOS_KEY = 'test_NdINrUfxEWJunaHyvJoPDZriZhL';
const REVENUECAT_ANDROID_KEY = 'test_lgmTYVzCSLVpnOEmYgngglIqvqM';

export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const initializeRevenueCat = async (userId?: string) => {
  if (!isNativePlatform()) {
    console.log('RevenueCat: Not a native platform, skipping initialization');
    return;
  }

  try {
    const apiKey = Capacitor.getPlatform() === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
    
    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });
    
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    console.log('RevenueCat initialized successfully');
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

    // Check for active entitlements - 'premium' is a common entitlement name
    const premiumEntitlement = customerInfo.entitlements.active['premium'];
    
    if (premiumEntitlement) {
      return {
        isActive: true,
        expirationDate: premiumEntitlement.expirationDate || undefined,
        productId: premiumEntitlement.productIdentifier,
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
