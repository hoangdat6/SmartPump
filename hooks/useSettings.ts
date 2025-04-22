import { useState, useEffect } from 'react';
import { database } from '@/firebaseConfig';
import { ref, onValue, update } from 'firebase/database';

export function useSettings() {
  // Settings state
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [minWaterLevel, setMinWaterLevel] = useState(20);
  const [maxWaterLevel, setMaxWaterLevel] = useState(90);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lowWaterAlert, setLowWaterAlert] = useState(true);
  const [pumpingAlert, setPumpingAlert] = useState(true);
  const [connectionAlert, setConnectionAlert] = useState(true);
  const [sensorToBottom, setSensorToBottom] = useState(14.05);
  const [tankHeight, setTankHeight] = useState(7);
  const [pumpFlow, setPumpFlow] = useState(1.6);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reference to the settings in Firebase
    const settingsRef = ref(database, 'devices/device1/settings');
    
    // Create a real-time listener for settings changes
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      try {
        setIsLoading(true);
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log('Settings data:', data);
          // Update state with real data
          setIsAutoMode(data.isAutoMode);
          setMinWaterLevel(data.minWaterLevel);
          setMaxWaterLevel(data.maxWaterLevel);
          setNotificationsEnabled(data.notificationsEnabled);
          setLowWaterAlert(data.lowWaterAlert);
          setPumpingAlert(data.pumpingAlert);
          setConnectionAlert(data.connectionAlert);
          setSensorToBottom(data.sensorToBottom || 14.05);
          setTankHeight(data.tankHeight || 7);
          setPumpFlow(data.pumpFlow || 1.6);
          setError(null);
        } else {
          setError("No settings data found");
        }
      } catch (err) {
        setError(`Failed to load settings: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      setError(`Database error: ${error.message}`);
      setIsLoading(false);
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);

  // Save settings to Firebase
  const saveSettings = async () => {
    try {
      const settingsRef = ref(database, 'devices/device1/settings');
      console.log('Saving settings to Firebase:', {
        isAutoMode,
        minWaterLevel,
        maxWaterLevel,
        notificationsEnabled,
        lowWaterAlert,
        pumpingAlert,
        connectionAlert,
        sensorToBottom,
        tankHeight,
        pumpFlow
      });
      await update(settingsRef, {
        isAutoMode,
        minWaterLevel,
        maxWaterLevel,
        notificationsEnabled,
        lowWaterAlert,
        pumpingAlert,
        connectionAlert,
        sensorToBottom,
        tankHeight,
        pumpFlow
      });
      
      console.log('Settings saved successfully to Firebase');
    } catch (err) {
      setError(`Failed to save settings: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error saving settings:', err);
    }
  };

  // auto save settings
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveSettings();
    }, 2000); // Save settings after 2 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [isAutoMode, minWaterLevel, maxWaterLevel, notificationsEnabled, lowWaterAlert, pumpingAlert, connectionAlert, sensorToBottom, tankHeight, pumpFlow]);

  return {
    // State
    isAutoMode,
    minWaterLevel,
    maxWaterLevel,
    notificationsEnabled,
    lowWaterAlert,
    pumpingAlert,
    connectionAlert,
    sensorToBottom,
    tankHeight,
    pumpFlow,
    isLoading,
    error,
    
    // State setters
    setIsAutoMode,
    setMinWaterLevel,
    setMaxWaterLevel,
    setNotificationsEnabled,
    setLowWaterAlert,
    setPumpingAlert,
    setConnectionAlert,
    setSensorToBottom,
    setTankHeight,
    setPumpFlow,
    
    // Actions
    saveSettings,
  };
}
