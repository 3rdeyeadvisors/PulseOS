import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.da82dfe427e3438aa7ae849ba31da71a',
  appName: 'PulseOS',
  webDir: 'dist',
  server: {
    url: 'https://da82dfe4-27e3-438a-a7ae-849ba31da71a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'PulseOS'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0b',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0b'
    }
  }
};

export default config;
