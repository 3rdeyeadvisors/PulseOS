import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tech.pulseos.app',
  appName: 'PulseOS',
  webDir: 'dist',
  
  // iOS Configuration
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'pulseos',
    backgroundColor: '#0a0a0b'
  },
  
  // Android Configuration
  android: {
    backgroundColor: '#0a0a0b',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  
  // Plugin Configurations
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0b',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0a0a0b',
      overlaysWebView: false
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  
  // Server configuration for development (comment out for production builds)
  // server: {
  //   url: 'https://da82dfe4-27e3-438a-a7ae-849ba31da71a.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // }
};

export default config;
