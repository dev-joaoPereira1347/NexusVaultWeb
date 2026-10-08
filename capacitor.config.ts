import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexusvault.app',
  appName: 'NexusVault',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#F7F0E9'
    }
  }
};

export default config;
