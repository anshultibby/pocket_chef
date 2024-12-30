import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kitchenelf.app',
  appName: 'Kitchen Elf',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'localhost:*',
      '127.0.0.1:*',
      'pocketchef-production.up.railway.app',
      '*.supabase.co',
      'kitchen-elf.vercel.app'
    ],
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#000000"
  }
};

export default config;
