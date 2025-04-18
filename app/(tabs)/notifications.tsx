import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNotifications } from '@/hooks/useNotifications';

const COLORS = {
  primary: '#0095ff',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  text: '#1a1a1a',
  textLight: '#6b7280',
  background: '#f8fafc',
  cardBg: '#ffffff',
  border: '#e2e8f0',
};

export default function NotificationsScreen() {
  const { 
    notifications, 
    isLoading,
    error,
    markAsRead, 
    clearAll, 
    getNotificationIcon, 
    getTitleColor 
  } = useNotifications();

  const renderNotificationItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationIcon}>
          {getNotificationIcon(item.type)}
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        
        <View style={styles.notificationText}>
          <ThemedText 
            type="defaultSemiBold" 
            style={{ color: getTitleColor(item.type) }}
          >
            {item.title}
          </ThemedText>

          <ThemedText style={styles.notificationMessage}>{item.message}</ThemedText>
          <ThemedText style={styles.timestamp}>{item.formattedTimestamp}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <ThemedText style={styles.loadingText}>Đang tải thông báo...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <ThemedText style={styles.errorText}>Lỗi: {error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Thông Báo</ThemedText>
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
            <ThemedText style={styles.clearButtonText}>Xóa tất cả</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={80} color={COLORS.border} />
          <ThemedText type="subtitle" style={styles.emptyStateText}>
            Không có thông báo nào
          </ThemedText>
          <ThemedText style={styles.emptyStateSubtext}>
            Thông báo về các sự kiện của hệ thống bơm nước sẽ xuất hiện ở đây
          </ThemedText>
          <Link href="/(tabs)/dashboard" asChild>
            <TouchableOpacity style={styles.dashboardButton}>
              <ThemedText style={styles.dashboardButtonText}>
                Đi đến bảng điều khiển
              </ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.textLight,
  },
  errorText: {
    marginTop: 16,
    color: COLORS.error,
    textAlign: 'center',
    maxWidth: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
  },
  clearButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  notificationsList: {
    paddingBottom: 20,
  },
  notificationItem: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: 16,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notificationText: {
    flex: 1,
  },
  notificationMessage: {
    marginTop: 4,
    marginBottom: 8,
    color: COLORS.textLight,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    marginTop: 16,
    textAlign: 'center',
    color: COLORS.text,
  },
  emptyStateSubtext: {
    textAlign: 'center',
    marginTop: 8,
    color: COLORS.textLight,
  },
  dashboardButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  dashboardButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
