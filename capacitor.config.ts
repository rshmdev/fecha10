import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fecha10.app',
  appName: 'Fecha10',
  webDir: 'dist',

  server: {
    androidScheme: 'https',
  },

  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: true,
      spinnerColor: '#7c3aed',
      androidScaleType: 'CENTER_CROP',
      androidSplashResourceName: 'splash',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#7c3aed',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Geolocation: {
      foregroundPermission: 'Permitir localização para exibir peladas próximas',
    },
    Camera: {
      presentationStyle: 'fullscreen',
    },
  },

  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  ios: {
    contentInset: 'automatic',
  },
};

export default config;