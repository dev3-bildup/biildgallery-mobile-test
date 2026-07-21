import Constants from 'expo-constants';

interface AppConfig {
  unsplashAccessKey: string;
  unsplashBaseUrl: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppConfig>;

export const appConfig: AppConfig = {
  unsplashAccessKey: extra.unsplashAccessKey ?? '',
  unsplashBaseUrl: extra.unsplashBaseUrl ?? 'https://api.unsplash.com',
};
