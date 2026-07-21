import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export function LoadingFooter() {
  return (
    <View style={styles.container} testID="loading-footer">
      <ActivityIndicator size="small" color="#ffffff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 20, alignItems: 'center' },
});
