import { CapacitorConfig } from '@capacitor/cli';

const isDevMode = process.env.NEXT_PUBLIC_APP_MODE === 'development';

const config: CapacitorConfig = {
  appId: 'com.kitchenelf.app',
  appName: 'Kitchen Elf',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: isDevMode ? 'localhost' : 'com.kitchenelf.app',
    allowNavigation: [
      'localhost',
      '*.kitchen-elf.com',
      'kitchen-elf.vercel.app',
      'pocketchef-production.up.railway.app',
      '192.168.*',
    ],
  },
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#000000",
    preferredContentMode: 'mobile'
  },
  plugins: {
    Camera: {
      ios: {
        usageDescription: "Kitchen Elf needs access to your camera to take photos of receipts and food items."
      }
    },
    Photos: {
      ios: {
        usageDescription: "Kitchen Elf needs access to your photo library to upload receipt images and food items."
      }
    }
  }
};

export default config;
