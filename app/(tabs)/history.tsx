import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useHistory } from '@/hooks/useHistory';

// Get device width for responsive layouts
const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const { pumpEvents, chartData, viewMode, setViewMode, maxValue, totalWater } = useHistory();

  const renderPumpEvent = ({ item }: { item: any }) => (
    <View style={styles.pumpCard}>
      <View style={styles.pumpCardHeader}>
        <ThemedText type="defaultSemiBold" style={styles.pumpDate}>
          {item.date} - {item.time}
        </ThemedText>
        <View style={[
          styles.autoModeBadge, 
          { backgroundColor: item.isAuto ? '#4CAF50' : '#FFC107' }
        ]}>
          <ThemedText style={styles.autoModeText}>
            {item.isAuto ? 'Tự động' : 'Thủ công'}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.pumpCardDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={18} color="#6C757D" />
          <ThemedText style={{
            color: '#4ade80',
          }}>{item.duration}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="water-outline" size={18} color="#6C757D" />
          <ThemedText style={{
            color: '#0077e6',
            // fontWeight: '600',
          }}>{item.amountLiters} lít</ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Lịch Sử Hoạt Động</ThemedText>
        
        {/* Toggle between list and chart view */}
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]} 
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color={viewMode === 'list' ? '#007BFF' : '#6C757D'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, viewMode === 'chart' && styles.activeToggle]} 
            onPress={() => setViewMode('chart')}
          >
            <Ionicons name="bar-chart" size={20} color={viewMode === 'chart' ? '#007BFF' : '#6C757D'} />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? (
        /* List View */
        <FlatList
          data={pumpEvents}
          renderItem={renderPumpEvent}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        /* Chart View */
        <View style={styles.chartContainer}>
          <ThemedText type="subtitle" style={styles.chartTitle}>
            Lượng nước đã bơm (lít) theo ngày
          </ThemedText>
          
          {/* Simple bar chart visualization */}
          <View style={styles.chart}>
            {chartData.map((item, index) => (
              <View key={index} style={styles.chartBarContainer}>
                <View style={styles.chartBarLabelContainer}>
                  <ThemedText style={styles.chartBarValue}>{item.value}</ThemedText>
                </View>
                <View style={[
                  styles.chartBar, 
                  { height: (item.value / maxValue) * 200 }
                ]} />
                <ThemedText style={styles.chartBarLabel}>{item.day}</ThemedText>
              </View>
            ))}
          </View>
          
          <ThemedText style={styles.chartFooter}>
            Tổng cộng: {totalWater} lít nước
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  headerTitle: {
    color: '#1a1a1a',
    fontSize: 24,
    fontWeight: 'bold',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#E9ECEF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  toggleButton: {
    padding: 8,
    paddingHorizontal: 16,
  },
  activeToggle: {
    backgroundColor: '#007BFF20',
  },
  list: {
    paddingBottom: 20,
  },
  pumpCard: {
    backgroundColor: '#FFFFFF', // Bright card background
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000', // Brighter shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pumpCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pumpDate: {
    fontSize: 16,
    color: '#495057',
  },
  autoModeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  autoModeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  pumpCardDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    color: '#6C757D',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  chartTitle: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#495057',
  },
  chart: {
    width: width - 40,
    height: 250,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DEE2E6',
  },
  chartBarContainer: {
    alignItems: 'center',
    width: (width - 80) / 7,
  },
  chartBarLabelContainer: {
    height: 20,
  },
  chartBarValue: {
    fontSize: 12,
    color: '#6C757D',
  },
  chartBar: {
    width: 20,
    backgroundColor: '#007BFF', // Brighter chart bar
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    marginVertical: 5,
  },
  chartBarLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  chartFooter: {
    marginTop: 20,
    fontWeight: '600',
    color: '#495057',
  },
});
