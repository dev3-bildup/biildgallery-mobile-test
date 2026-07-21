import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { buildContainer, AppDependencies } from './src/di/Container';
import { DependencyProvider } from './src/di/AppProviders';
import { AppNavigator } from './src/navigation/AppNavigator';
import { appConfig } from './src/config';

export default function App() {
  const [deps, setDeps] = useState<AppDependencies | null>(null);

  useEffect(() => {
    const container = buildContainer({
      unsplashAccessKey: appConfig.unsplashAccessKey,
      unsplashBaseUrl: appConfig.unsplashBaseUrl,
    });
    container.database.open().then(() => setDeps(container));
  }, []);

  if (!deps) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <DependencyProvider dependencies={deps}>
        <StatusBar style="light" />
        <AppNavigator />
      </DependencyProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
});
