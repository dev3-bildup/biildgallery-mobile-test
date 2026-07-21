import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDependencies } from '../../di/AppProviders';
import { useGalleryViewModel } from '../viewmodels/useGalleryViewModel';
import { ImageGrid } from '../components/ImageGrid';
import { SearchBar } from '../components/SearchBar';
import { ErrorView } from '../components/ErrorView';
import { OfflineBanner } from '../components/OfflineBanner';
import { GalleryImage } from '../../models/GalleryImage';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

export function GalleryScreen({ navigation }: Props) {
  const { useCases, networkMonitor } = useDependencies();
  const vm = useGalleryViewModel(useCases.getImageFeed, useCases.searchImages, useCases.toggleFavorite);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    networkMonitor.isOnline().then(setIsOnline);
  }, [networkMonitor]);

  const handlePressImage = (image: GalleryImage) => {
    navigation.navigate('ImageDetail', { image });
  };

  const showEmptyError = vm.status === 'error' && vm.images.length === 0;

  return (
    <SafeAreaView style={styles.container} testID="gallery-screen">
      {!isOnline ? <OfflineBanner /> : null}
      <SearchBar value={vm.searchQuery} onChangeText={vm.setSearchQuery} />
      <View style={styles.gridContainer}>
        {showEmptyError ? (
          <ErrorView message={vm.errorMessage ?? 'Unknown error'} onRetry={vm.refresh} />
        ) : (
          <ImageGrid
            images={vm.images}
            isLoadingMore={vm.status === 'loadingMore'}
            isRefreshing={vm.status === 'refreshing'}
            onEndReached={vm.loadNextPage}
            onRefresh={vm.refresh}
            onPressImage={handlePressImage}
            onToggleFavorite={vm.toggleFavorite}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gridContainer: { flex: 1 },
});
