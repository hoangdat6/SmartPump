import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { useDashboard } from '@/hooks/useDashboard';
import { initDeviceStatus } from '@/utils/firebaseUtils';

// Get device width for responsive layouts
const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  useEffect(() => {
    // Gọi hàm khởi tạo khi ứng dụng bắt đầu
    const initializeData = async () => {
      await initDeviceStatus();
    };
    initializeData();
  }, []);

  const {
    isPumpOn,
    waterLevel,
    wifiConnected,
    espConnected,
    animatedLevel,
    isLoading,
    error,
    getSystemStatus,
    getStatusColor,
    togglePump,
    changeWaterLevel,
  } = useDashboard();

  // Animated style for water level
  const waterStyle = useAnimatedStyle(() => {
    return {
      height: `${animatedLevel.value}%`,
    };
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0095ff" />
        <ThemedText style={{ marginTop: 20 }}>Đang kết nối...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={60} color="#D9534F" />
        <ThemedText style={{ marginTop: 20, color: "#D9534F", textAlign: "center" }}>{error}</ThemedText>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => window.location.reload()}
        >
          <ThemedText style={styles.retryButtonText}>Thử lại</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Bảng Điều Khiển</ThemedText>
        <View style={styles.connectionStatus}>
          <View style={styles.statusItem}>
            <Ionicons
              name={wifiConnected ? "wifi" : "wifi-outline"}
              size={20}
              color={wifiConnected ? "#5CB85C" : "#D9534F"}
            />
            <ThemedText style={wifiConnected ? styles.statusConnected : styles.statusDisconnected}>
              WiFi
            </ThemedText>
          </View>
          <View style={styles.statusItem}>
            <Ionicons
              name={espConnected ? "hardware-chip" : "hardware-chip-outline"}
              size={20}
              color={espConnected ? "#5CB85C" : "#D9534F"}
            />
            <ThemedText style={espConnected ? styles.statusConnected : styles.statusDisconnected}>
              ESP8266
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>

      {/* Water Tank Visualization */}
      <SafeAreaView style={styles.tankContainer}>
        <View style={styles.tankOutline}>
          <Animated.View style={[styles.waterFill, waterStyle]} />
          <View style={styles.measureMarks}>
            <ThemedText style={styles.markText}>100%</ThemedText>
            <ThemedText style={styles.markText}>75%</ThemedText>
            <ThemedText style={styles.markText}>50%</ThemedText>
            <ThemedText style={styles.markText}>25%</ThemedText>
            <ThemedText style={styles.markText}>0%</ThemedText>
          </View>
        </View>
        <SafeAreaView style={{
        }}>
          <View>
            <Text style={styles.waterLevelText}>
              {waterLevel}%
            </Text>
          </View>
          <ThemedText type="subtitle"
            style={{
              color: '#0a7ea4',
            }}>Mực nước hiện tại</ThemedText>
        </SafeAreaView>

        {/* System Status */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <ThemedText style={styles.statusText}>{getSystemStatus()}</ThemedText>
        </View>
      </SafeAreaView>

      {/* Pump Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.pumpButton, isPumpOn ? styles.pumpButtonOn : styles.pumpButtonOff]}
          onPress={togglePump}
        >
          <Ionicons
            name={isPumpOn ? "water" : "water-outline"}
            size={32}
            color="#FFF"
          />
          <ThemedText style={styles.pumpButtonText}>
            {isPumpOn ? "TẮT BƠM" : "BẬT BƠM"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Updated styles for a modern and consistent look
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 160,
    backgroundColor: '#f8fafc',
    minHeight: '100%',
    padding: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#0095ff',
    padding: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#1a1a1a',
    fontSize: 24,
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusConnected: {
    color: '#5CB85C',
    fontWeight: '600',
  },
  statusDisconnected: {
    color: '#D9534F',
    fontWeight: '600',
  },
  tankContainer: {
    minHeight: 300,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  tankOutline: {
    width: width * 0.6,
    height: 300,
    borderWidth: 2,
    borderColor: '#0a7ea4',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#0095ff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 1, // để nằm dưới
  },
  measureMarks: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingRight: 6,
    zIndex: 2, // đảm bảo nằm trên waterFill
  },
  markText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  waterLevelText: {
    fontWeight: 'bold',
    marginTop: 30,
    fontSize: 40,
    color: '#0a7ea4',
    width: '100%',
    textAlign: 'center',
  },
  statusBadge: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 20,
    backgroundColor: '#0095ff',
  },
  statusText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
  },
  controlsContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  pumpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.7,
    padding: 16,
    borderRadius: 30,
    gap: 10,
    backgroundColor: '#0095ff',
  },
  pumpButtonOn: {
    backgroundColor: '#D9534F',
  },
  pumpButtonOff: {
    backgroundColor: '#0a7ea4',
  },
  pumpButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
  },
});
