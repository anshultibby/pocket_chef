import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kitchenelf.app',
  appName: 'Kitchen Elf',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    errorPath: "index.html"
  },
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: true,
    backgroundColor: "#000000"
  }
};

export default config;
