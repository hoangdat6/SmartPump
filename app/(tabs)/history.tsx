import React, { useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useHistory } from '@/hooks/useHistory';

// Get device width for responsive layouts
const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const { pumpEvents, chartData, stackedChartData, viewMode, setViewMode, maxValue, totalWater } = useHistory();
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [tooltipInfo, setTooltipInfo] = useState<{
    segmentId: string;
    time: string;
    value: number;
    position: number; // horizontal position
  } | null>(null);

  const formatDate = (date: string) => {
    let [day, month] = date.split("/")
    return `${day}/${month}`
  }

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
          }}>{item.amountLiters} lít</ThemedText>
        </View>
      </View>
    </View>
  );

  const handleSegmentPress = (segment: any, index: number, columnIndex: number) => {
    if (selectedSegment === segment.id) {
      setSelectedSegment(null);
      setTooltipInfo(null);
    } else {
      setSelectedSegment(segment.id);
      // Calculate horizontal position based on column index (centered)
      const columnWidth = (width - 80) / 7;
      const position = columnIndex * columnWidth + columnWidth / 2;
      setTooltipInfo({
        segmentId: segment.id,
        time: segment.time,
        value: segment.value,
        position: position,
      });
    }
  };

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
        /* Stacked Chart View */
        <View style={styles.chartContainer}>
          <ThemedText type="subtitle" style={styles.chartTitle}>
            Lượng nước đã bơm (lít) theo ngày
          </ThemedText>

          {/* Chart wrapper for positioning context */}
          <View style={styles.chartWrapper}>
            {/* Tooltip that appears above the chart */}
            {tooltipInfo && (
              <View 
                style={[
                  styles.tooltipContainer,
                  { 
                    left: tooltipInfo.position - 40, // Center tooltip (tooltip width is 100)
                    top: -15,  // Position above the chart
                  }
                ]}
              >
                <View style={styles.tooltip}>
                  <ThemedText style={styles.tooltipText}>
                    {tooltipInfo.time} - {tooltipInfo.value} lít
                  </ThemedText>
                </View>
                <View style={styles.tooltipArrow} />
              </View>
            )}

            {/* Stacked bar chart visualization */}
            <View style={styles.chart}>
              {stackedChartData.map((dayData, columnIndex) => (
                <View key={columnIndex} style={styles.chartBarContainer}>
                  <View style={styles.chartBarLabelContainer}>
                    <ThemedText style={styles.chartBarValue}>{dayData.totalValue}</ThemedText>
                  </View>
                  <View style={styles.stackedBarContainer}>
                    {dayData.segments.map((segment, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.chartBarSegment,
                          { 
                            height: (segment.value / maxValue) * 180,
                            backgroundColor: segment.color,
                            borderBottomWidth: i === 0 ? 0 : 1,
                            borderBottomColor: 'white',
                            // Highlight selected segment
                            borderColor: selectedSegment === segment.id ? '#FFF' : 'transparent',
                            borderWidth: selectedSegment === segment.id ? 2 : 0,
                          }
                        ]}
                        onPress={() => handleSegmentPress(segment, i, columnIndex)}
                      />
                    ))}
                  </View>
                  <ThemedText style={styles.chartBarLabel}>{formatDate(dayData.day)}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <ThemedText style={styles.chartFooter}>
            Tổng cộng: {totalWater} lít nước
          </ThemedText>

          <ThemedText style={styles.chartHint}>
            Chạm vào từng phần để xem thông tin chi tiết
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
  chartWrapper: {
    position: 'relative',
    width: width - 40,
    height: 280, // Added more height to accommodate tooltip
  },
  chart: {
    width: width - 40,
    height: 250,
    flexDirection: 'row',
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
  stackedBarContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarSegment: {
    width: 28,
    minHeight: 4,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tooltipContainer: {
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'center',
    width: 100,
  },
  tooltip: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 6,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0,0,0,0.8)',
    transform: [{ rotate: '180deg' }]
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
  chartHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
