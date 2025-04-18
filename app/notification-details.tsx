import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NotificationDetailsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Chi Tiết Thông Báo</ThemedText>
      <ThemedText style={styles.description}>
        Đây là nơi hiển thị chi tiết thông báo được chọn.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
});
