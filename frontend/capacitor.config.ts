import type { CapacitorConfig } from '@capacitor/cli';
import { environment } from '@src/environments/environment';

const config: CapacitorConfig = {
  appId: 'com.serwerigora.chat',
  appName: 'Chat',
  webDir: 'www',
  "plugins": {
    "CapacitorCookies": {
      "enabled": true
    }
  },
  server: {
    androidScheme: 'https',
    hostname: `chatfrontend.serwerigora.com`, // This is needed to make cookies work on Android, as they only work on a first-party domain. A workaround.
  }
};

export default config;
