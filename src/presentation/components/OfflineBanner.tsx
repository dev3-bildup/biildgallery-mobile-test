import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function OfflineBanner() {
  return (
    <View style={styles.container} testID="offline-banner">
      <Text style={styles.text}>You're offline — showing cached photos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#4a3200', paddingVertical: 6, alignItems: 'center' },
  text: { color: '#f5c451', fontSize: 12, fontWeight: '600' },
});
