module.exports = {
  expo: {
    name: 'BildGallery',
    slug: 'bildgallery',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.bildgallery.app',
    },
    android: {
      package: 'com.bildgallery.app',
      adaptiveIcon: { backgroundColor: '#000000' },
    },
    extra: {
      unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY ?? '',
      unsplashBaseUrl: 'https://api.unsplash.com',
    },
  },
};
