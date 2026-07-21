import React, { useCallback, useMemo } from 'react';
import { Dimensions, FlatList, ListRenderItemInfo, RefreshControl, StyleSheet } from 'react-native';
import { GalleryImage } from '../../models/GalleryImage';
import { ImageCard } from './ImageCard';
import { LoadingFooter } from './LoadingFooter';

const NUM_COLUMNS = 3;
const GAP = 4;

interface Props {
  images: GalleryImage[];
  isLoadingMore: boolean;
  isRefreshing: boolean;
  onEndReached: () => void;
  onRefresh: () => void;
  onPressImage: (image: GalleryImage) => void;
  onToggleFavorite: (id: string) => void;
}

/**
 * Performance notes (also covered in README benchmarks):
 *  - `getItemLayout` avoids the measure-on-render pass, letting FlatList
 *    jump to any offset instantly (needed for smooth 60fps scroll + fast
 *    scrollbar dragging).
 *  - `removeClippedSubviews` unmounts offscreen rows on Android to cap
 *    memory growth during long infinite-scroll sessions.
 *  - `windowSize`/`maxToRenderPerBatch`/`updateCellsBatchingPeriod` tuned
 *    down from RN defaults to reduce the amount of work done per JS frame.
 *  - Item size is derived once from screen width, not recomputed per row.
 */
export function ImageGrid({
  images,
  isLoadingMore,
  isRefreshing,
  onEndReached,
  onRefresh,
  onPressImage,
  onToggleFavorite,
}: Props) {
  const itemSize = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return Math.floor(screenWidth / NUM_COLUMNS) - GAP;
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<GalleryImage>) => (
      <ImageCard image={item} size={itemSize} onPress={onPressImage} onToggleFavorite={onToggleFavorite} />
    ),
    [itemSize, onPressImage, onToggleFavorite]
  );

  const keyExtractor = useCallback((item: GalleryImage) => item.id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<GalleryImage> | null | undefined, index: number) => {
      const row = Math.floor(index / NUM_COLUMNS);
      return { length: itemSize, offset: itemSize * row, index };
    },
    [itemSize]
  );

  return (
    <FlatList
      data={images}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={NUM_COLUMNS}
      getItemLayout={getItemLayout}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#fff" />}
      ListFooterComponent={isLoadingMore ? <LoadingFooter /> : null}
      removeClippedSubviews
      maxToRenderPerBatch={12}
      updateCellsBatchingPeriod={50}
      windowSize={7}
      initialNumToRender={18}
      contentContainerStyle={styles.content}
      testID="image-grid"
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
});
