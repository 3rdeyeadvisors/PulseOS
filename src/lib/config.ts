import { Capacitor } from '@capacitor/core';

// Environment detection
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

// App configuration
export const APP_CONFIG = {
  // App identifiers
  appId: 'tech.pulseos.app',
  appName: 'PulseOS',
  
  // URLs
  productionUrl: 'https://pulseos.tech',
  webAppUrl: isProduction ? 'https://pulseos.tech' : window.location.origin,
  
  // Universal Links / App Links domain
  universalLinksDomain: 'pulseos.tech',
  
  // URL Schemes
  urlScheme: 'pulseos',
  
  // RevenueCat API Keys
  // TODO: Replace with your actual RevenueCat API keys from the dashboard
  revenueCat: {
    ios: {
      production: 'appl_PRODUCTION_KEY_HERE', // TODO: Add iOS production key
      test: 'appl_test_key_placeholder', // TODO: Add iOS sandbox key
    },
    android: {
      production: 'goog_PRODUCTION_KEY_HERE', // TODO: Add Android production key
      test: 'goog_test_key_placeholder', // TODO: Add Android sandbox key
    },
  },
  
  // Feature flags
  features: {
    pushNotifications: isNative,
    inAppPurchases: isNative,
    deepLinks: isNative,
    biometricAuth: isNative,
  },
  
  // App Store / Play Store links
  // TODO: Update these links after your app is published to the respective stores
  storeLinks: {
    ios: 'https://apps.apple.com/app/pulseos/id000000000',
    android: 'https://play.google.com/store/apps/details?id=tech.pulseos.app',
  },
} as const;

// Get the appropriate RevenueCat API key based on environment and platform
export function getRevenueCatApiKey(): string {
  const platform = Capacitor.getPlatform();
  
  if (platform === 'ios') {
    return isProduction 
      ? APP_CONFIG.revenueCat.ios.production 
      : APP_CONFIG.revenueCat.ios.test;
  }
  
  if (platform === 'android') {
    return isProduction 
      ? APP_CONFIG.revenueCat.android.production 
      : APP_CONFIG.revenueCat.android.test;
  }
  
  // Web fallback (RevenueCat not used on web)
  return '';
}

// Build deep link URL
export function buildDeepLink(path: string, params?: Record<string, string>): string {
  const baseUrl = isNative 
    ? `${APP_CONFIG.urlScheme}://` 
    : APP_CONFIG.webAppUrl;
  
  let url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
}

// Build universal link URL (for sharing, emails, etc.)
export function buildUniversalLink(path: string, params?: Record<string, string>): string {
  let url = `https://${APP_CONFIG.universalLinksDomain}${path.startsWith('/') ? path : `/${path}`}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
}
