import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { GalleryImage } from '../../models/GalleryImage';

const BLURHASH_PLACEHOLDER = '|rF?hV%2WCj[ayj[a|j[az_3fQjsalV@fQfPax]-BAsBj[bF';

interface Props {
  image: GalleryImage;
  size: number;
  onPress: (image: GalleryImage) => void;
  onToggleFavorite: (id: string) => void;
}

/**
 * `expo-image` gives us disk+memory caching and progressive decoding for
 * free, which is why it's used instead of RN's built-in <Image>: it keeps
 * scroll performance smooth by decoding off the JS thread and reusing the
 * cache between the grid and detail views (same cache key = same URL).
 *
 * Wrapped in React.memo with a shallow prop comparator so FlatList re-renders
 * only the cards whose data actually changed (e.g. a single favorite toggle
 * shouldn't re-render the whole visible page).
 */
function ImageCardImpl({ image, size, onPress, onToggleFavorite }: Props) {
  return (
    <Pressable
      onPress={() => onPress(image)}
      style={[styles.container, { width: size, height: size }]}
      accessibilityRole="imagebutton"
      accessibilityLabel={image.description}
    >
      <Image
        source={{ uri: image.thumbUrl }}
        placeholder={{ blurhash: BLURHASH_PLACEHOLDER }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={150}
        cachePolicy="disk"
      />
      <Pressable
        onPress={() => onToggleFavorite(image.id)}
        style={styles.favoriteBadge}
        hitSlop={10}
        accessibilityLabel={image.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Text style={styles.favoriteIcon}>{image.isFavorite ? '♥' : '♡'}</Text>
      </Pressable>
      {image.pendingSync ? <View style={styles.pendingDot} /> : null}
    </Pressable>
  );
}

function propsAreEqual(prev: Props, next: Props): boolean {
  return (
    prev.image.id === next.image.id &&
    prev.image.isFavorite === next.image.isFavorite &&
    prev.image.pendingSync === next.image.pendingSync &&
    prev.size === next.size
  );
}

export const ImageCard = memo(ImageCardImpl, propsAreEqual);

const styles = StyleSheet.create({
  container: {
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    color: '#ffffff',
    fontSize: 16,
  },
  pendingDot: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f5a623',
  },
});
