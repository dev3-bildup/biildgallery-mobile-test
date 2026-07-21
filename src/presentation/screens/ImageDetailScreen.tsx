import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDependencies } from '../../di/AppProviders';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ImageDetail'>;

export function ImageDetailScreen({ route }: Props) {
  const { image } = route.params;
  const { useCases } = useDependencies();
  const [isFavorite, setIsFavorite] = useState(image.isFavorite);

  const handleToggleFavorite = async () => {
    const next = await useCases.toggleFavorite.execute(image.id);
    setIsFavorite(next);
  };

  return (
    <SafeAreaView style={styles.container} testID="image-detail-screen">
      <Image
        source={{ uri: image.fullUrl }}
        style={styles.image}
        contentFit="contain"
        transition={150}
        cachePolicy="disk"
      />
      <View style={styles.infoBar}>
        <View style={styles.textBlock}>
          <Text style={styles.author}>{image.authorName}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {image.description}
          </Text>
        </View>
        <Pressable onPress={handleToggleFavorite} hitSlop={12} testID="detail-favorite-button">
          <Text style={styles.favoriteIcon}>{isFavorite ? '♥' : '♡'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { flex: 1 },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  textBlock: { flex: 1, marginRight: 12 },
  author: { color: '#fff', fontSize: 16, fontWeight: '600' },
  description: { color: '#9a9a9a', fontSize: 13, marginTop: 2 },
  favoriteIcon: { color: '#fff', fontSize: 28 },
});
