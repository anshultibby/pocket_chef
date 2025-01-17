import { CapacitorConfig } from '@capacitor/cli';

const isDevMode = process.env.NEXT_PUBLIC_APP_MODE === 'development';
const localIp = process.env.NEXT_PUBLIC_LOCAL_IP || 'localhost';

const config: CapacitorConfig = {
  appId: 'com.kitchenelf.app',
  appName: 'Kitchen Elf',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: isDevMode ? 'http' : 'https',
    hostname: isDevMode ? localIp : 'com.kitchenelf.app',
    allowNavigation: [
      'localhost',
      '*.kitchen-elf.com',
      'kitchen-elf.vercel.app',
      'pocketchef-production.up.railway.app',
      '192.168.*',
    ]
  },
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#000000",
  }
};

export default config;
