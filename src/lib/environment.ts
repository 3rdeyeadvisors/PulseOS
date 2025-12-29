import { Capacitor } from '@capacitor/core';

/**
 * Environment detection utilities for PulseOS
 * Helps distinguish between development/production and web/native platforms
 */

// Check if running in development mode
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

// Check if running in production mode
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

// Check if running on a native platform (iOS/Android)
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Check if running on iOS
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

// Check if running on Android
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

// Check if running on web
export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

// Get the current platform name
export const getPlatformName = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

// Get environment info for debugging
export const getEnvironmentInfo = () => {
  return {
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    isNative: isNative(),
    platform: getPlatformName(),
  };
};
