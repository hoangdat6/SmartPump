import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Switch, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSettings } from '@/hooks/useSettings';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Brighter, more modern app colors
const COLORS = {
  primary: '#0095ff',           // Bright blue
  primaryLight: 'rgba(0, 149, 255, 0.12)',
  primaryDark: '#0077e6',
  gradient1: '#0095ff',         // Start of gradient
  gradient2: '#00c6ff',         // End of gradient
  success: '#10b981',           // Vibrant green
  successLight: 'rgba(16, 185, 129, 0.12)',
  warning: '#f59e0b',           // Bright amber
  warningLight: 'rgba(245, 158, 11, 0.12)',
  error: '#ef4444',             // Bright red
  errorLight: 'rgba(239, 68, 68, 0.12)',
  text: '#111827',              // Almost black text
  textLight: '#6b7280',         // Medium gray
  textExtraLight: '#9ca3af',    // Lighter gray
  border: '#f1f5f9',            // Very light gray
  cardBg: '#ffffff',            // Pure white
  background: '#f8fafc',        // Off-white background
  divider: '#e2e8f0',           // Light gray divider
  shadow: 'rgba(0, 149, 255, 0.15)', // Blue tinted shadow
};

export default function SettingsScreen() {
  const [sensorInput, setSensorInput] = useState('');
  const [tankHeightInput, setTankHeightInput] = useState('');
  const [pumpFlowInput, setPumpFlowInput] = useState('');

  const {
    isAutoMode,
    setIsAutoMode,
    minWaterLevel,
    setMinWaterLevel,
    maxWaterLevel,
    setMaxWaterLevel,
    notificationsEnabled,
    setNotificationsEnabled,
    lowWaterAlert,
    setLowWaterAlert,
    pumpingAlert,
    setPumpingAlert,
    connectionAlert,
    setConnectionAlert,
    saveSettings,
    sensorToBottom,
    setSensorToBottom,
    tankHeight,
    setTankHeight,
    pumpFlow,
    setPumpFlow,
  } = useSettings();

  const handleInputChange = useCallback((
      text: string, 
      setterNumber: React.Dispatch<React.SetStateAction<number>>,
      setterInput: React.Dispatch<React.SetStateAction<string>>
    ) => {
    const sanitized = text.replace(',', '.');
    // Chỉ cho phép ký tự số, dấu chấm và xóa ký tự lạ
    if (/^[0-9]*\.?[0-9]*$/.test(sanitized) || sanitized === '') {
      setterInput(sanitized);
      const parsed = parseFloat(sanitized);
      if (!isNaN(parsed)) {
        setterNumber(parsed);
      }
      else {
        setterNumber(0);
      }
    }

  }, []);

  // Local state for slider values to avoid flickering
  const [localMinLevel, setLocalMinLevel] = useState(minWaterLevel);
  const [localMaxLevel, setLocalMaxLevel] = useState(maxWaterLevel);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Cài Đặt Hệ Thống</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Điều chỉnh các thông số hoạt động của máy bơm
        </ThemedText>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Auto Mode Toggle */}
        <Animated.View entering={FadeInDown} style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="options-outline" size={22} color={COLORS.primary} />
            <ThemedText style={styles.cardTitle}>Chế độ hoạt động</ThemedText>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="flash" size={20} color={COLORS.primary} />
              </View>
              <View>
                <ThemedText style={styles.settingLabel}>Chế độ tự động</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Tự động bật/tắt bơm theo ngưỡng mực nước
                </ThemedText>
              </View>
            </View>
            <Switch
              value={isAutoMode}
              onValueChange={setIsAutoMode}
              trackColor={{ false: '#e2e8f0', true: COLORS.primaryLight }}
              thumbColor={isAutoMode ? COLORS.primary : '#cbd5e1'}
              ios_backgroundColor="#e2e8f0"
            />
          </View>
        </Animated.View>

        {/* Water Level Thresholds */}
        {isAutoMode && (
          <Animated.View entering={FadeInDown} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="water-outline" size={22} color={COLORS.primary} />
              <ThemedText style={styles.cardTitle}>Ngưỡng mực nước</ThemedText>
            </View>

            {/* Minimum Water Level */}
            <View style={styles.thresholdSetting}>
              <View style={styles.thresholdHeader}>
                <ThemedText style={styles.thresholdLabel}>Ngưỡng bật bơm</ThemedText>
                <View style={styles.thresholdBadge}>
                  <ThemedText style={styles.thresholdValue}>{minWaterLevel}%</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.thresholdDescription}>
                Bơm sẽ tự động bật khi mực nước xuống dưới ngưỡng này
              </ThemedText>

              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={50}
                step={5}
                value={localMinLevel}
                onValueChange={setLocalMinLevel}
                onSlidingComplete={(value) => {
                  // Only update the global state when sliding is complete
                  setMinWaterLevel(value);
                }}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor="#e2e8f0"
                thumbTintColor={COLORS.primary}
              />

              <View style={styles.sliderLabels}>
                <View style={styles.sliderLabelContainer}>
                  <ThemedText style={styles.sliderLabel}>5%</ThemedText>
                </View>
                <View style={styles.sliderLabelContainer}>
                  <ThemedText style={styles.sliderLabel}>50%</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Maximum Water Level */}
            <View style={styles.thresholdSetting}>
              <View style={styles.thresholdHeader}>
                <ThemedText style={styles.thresholdLabel}>Ngưỡng tắt bơm</ThemedText>
                <View style={styles.thresholdBadge}>
                  <ThemedText style={styles.thresholdValue}>{maxWaterLevel}%</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.thresholdDescription}>
                Bơm sẽ tự động tắt khi mực nước đạt đến ngưỡng này
              </ThemedText>

              <Slider
                style={styles.slider}
                minimumValue={60}
                maximumValue={100}
                step={5}
                value={localMaxLevel}
                onValueChange={setLocalMaxLevel}
                onSlidingComplete={(value) => {
                  // Only update the global state when sliding is complete
                  setMaxWaterLevel(value);
                }}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor="#e2e8f0"
                thumbTintColor={COLORS.primary}
              />

              <View style={styles.sliderLabels}>
                <View style={styles.sliderLabelContainer}>
                  <ThemedText style={styles.sliderLabel}>60%</ThemedText>
                </View>
                <View style={styles.sliderLabelContainer}>
                  <ThemedText style={styles.sliderLabel}>100%</ThemedText>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Notification Settings */}
        {/* <Animated.View entering={FadeInDown} style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
            <ThemedText style={styles.cardTitle}>Cài đặt thông báo</ThemedText>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications" size={20} color={COLORS.primary} />
              </View>
              <ThemedText style={styles.settingLabel}>Bật thông báo</ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e2e8f0', true: COLORS.primaryLight }}
              thumbColor={notificationsEnabled ? COLORS.primary : '#cbd5e1'}
              ios_backgroundColor="#e2e8f0"
            />
          </View>

          {notificationsEnabled && (
            <>
              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingItemContent}>
                  <View style={[styles.iconContainer, { backgroundColor: COLORS.warningLight }]}>
                    <Ionicons name="warning-outline" size={20} color={COLORS.warning} />
                  </View>
                  <ThemedText style={styles.settingLabel}>Cảnh báo mực nước thấp</ThemedText>
                </View>
                <Switch
                  value={lowWaterAlert}
                  onValueChange={setLowWaterAlert}
                  trackColor={{ false: '#e2e8f0', true: COLORS.primaryLight }}
                  thumbColor={lowWaterAlert ? COLORS.primary : '#cbd5e1'}
                  ios_backgroundColor="#e2e8f0"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingItemContent}>
                  <View style={[styles.iconContainer, { backgroundColor: COLORS.successLight }]}>
                    <Ionicons name="water" size={20} color={COLORS.success} />
                  </View>
                  <ThemedText style={styles.settingLabel}>Thông báo khi bơm hoạt động</ThemedText>
                </View>
                <Switch
                  value={pumpingAlert}
                  onValueChange={setPumpingAlert}
                  trackColor={{ false: '#e2e8f0', true: COLORS.primaryLight }}
                  thumbColor={pumpingAlert ? COLORS.primary : '#cbd5e1'}
                  ios_backgroundColor="#e2e8f0"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingItemContent}>
                  <View style={[styles.iconContainer, { backgroundColor: COLORS.errorLight }]}>
                    <Ionicons name="wifi" size={20} color={COLORS.error} />
                  </View>
                  <ThemedText style={styles.settingLabel}>Cảnh báo mất kết nối</ThemedText>
                </View>
                <Switch
                  value={connectionAlert}
                  onValueChange={setConnectionAlert}
                  trackColor={{ false: '#e2e8f0', true: COLORS.primaryLight }}
                  thumbColor={connectionAlert ? COLORS.primary : '#cbd5e1'}
                  ios_backgroundColor="#e2e8f0"
                />
              </View>
            </>
          )}
        </Animated.View> */}

        {/* Sensor Configuration */}
        <Animated.View entering={FadeInDown} style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="hardware-chip-outline" size={22} color={COLORS.primary} />
            <ThemedText style={styles.cardTitle}>Cấu hình cảm biến</ThemedText>
          </View>

          {/* Sensor to Bottom Distance */}
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={sensorInput}
            onChangeText={(text => handleInputChange(text, setSensorToBottom, setSensorInput))}
            placeholder="14.05"
          />

          <View style={styles.divider} />

          {/* Tank Height */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Chiều cao bể nước (m)</ThemedText>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={tankHeightInput}
              onChangeText={(text) => handleInputChange(text, setTankHeight, setTankHeightInput)}
              placeholder={tankHeight.toString()}
            />
          </View>

          <View style={styles.divider} />

          {/* Pump Flow Rate */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Lưu lượng bơm (Lít/phút)</ThemedText>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={pumpFlowInput}
              onChangeText={(text => handleInputChange(text, setPumpFlow, setPumpFlowInput))}
              placeholder={pumpFlow.toString()}
            />
          </View>
        </Animated.View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButtonContainer}
          onPress={saveSettings}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.gradient1, COLORS.gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            <Ionicons name="save-outline" size={20} color="#FFF" />
            <ThemedText style={styles.saveButtonText}>Lưu Cài Đặt</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  header: {
    marginBottom: 24,
    paddingTop: 10,
  },
  headerTitle: {
    color: '#1a1a1a',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: COLORS.textLight,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: COLORS.text,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'PoppinsMedium',
    color: COLORS.text,
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    color: COLORS.textLight,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 12,
  },
  thresholdSetting: {
    paddingVertical: 8,
  },
  thresholdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  thresholdLabel: {
    fontSize: 16,
    fontFamily: 'PoppinsMedium',
    color: COLORS.text,
  },
  thresholdBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  thresholdValue: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: COLORS.primary,
  },
  thresholdDescription: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    color: COLORS.textLight,
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  sliderLabelContainer: {
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: COLORS.textLight,
  },
  inputContainer: {
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'PoppinsMedium',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'PoppinsRegular',
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  saveButtonContainer: {
    marginVertical: 20,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveButton: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
  },
});
