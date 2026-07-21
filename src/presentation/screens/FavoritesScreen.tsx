import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDependencies } from '../../di/AppProviders';
import { useFavoritesViewModel } from '../viewmodels/useFavoritesViewModel';
import { ImageGrid } from '../components/ImageGrid';
import { ErrorView } from '../components/ErrorView';
import { GalleryImage } from '../../models/GalleryImage';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

export function FavoritesScreen({ navigation }: Props) {
  const { useCases } = useDependencies();
  const vm = useFavoritesViewModel(useCases.getFavorites, useCases.toggleFavorite, useCases.syncFavorites);

  const handlePressImage = (image: GalleryImage) => {
    navigation.navigate('ImageDetail', { image });
  };

  if (vm.errorMessage && vm.favorites.length === 0) {
    return <ErrorView message={vm.errorMessage} onRetry={vm.refresh} />;
  }

  if (!vm.isLoading && vm.favorites.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer} testID="favorites-empty">
        <Text style={styles.emptyText}>No favorites yet. Tap the heart on any photo to save it here.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="favorites-screen">
      <ImageGrid
        images={vm.favorites}
        isLoadingMore={false}
        isRefreshing={vm.isLoading}
        onEndReached={() => {}}
        onRefresh={vm.refresh}
        onPressImage={handlePressImage}
        onToggleFavorite={vm.removeFavorite}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  emptyContainer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: '#9a9a9a', textAlign: 'center', fontSize: 14 },
});
