import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Text } from 'react-native';
import { GalleryScreen } from '../presentation/screens/GalleryScreen';
import { ImageDetailScreen } from '../presentation/screens/ImageDetailScreen';
import { FavoritesScreen } from '../presentation/screens/FavoritesScreen';
import { GalleryImage } from '../models/GalleryImage';

export type RootStackParamList = {
  Gallery: undefined;
  ImageDetail: { image: GalleryImage };
  Favorites: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }}>
        <Stack.Screen
          name="Gallery"
          component={GalleryScreen}
          options={({ navigation }) => ({
            title: 'BildGallery',
            headerRight: () => (
              <Pressable onPress={() => navigation.navigate('Favorites')} testID="favorites-nav-button">
                <Text style={{ color: '#fff', fontSize: 20 }}>♥</Text>
              </Pressable>
            ),
          })}
        />
        <Stack.Screen name="ImageDetail" component={ImageDetailScreen} options={{ title: '' }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
