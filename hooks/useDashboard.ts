import { useState, useEffect } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { database } from '@/firebaseConfig';
import { ref, onValue, update, get, set } from 'firebase/database';

export function useDashboard() {
  // State for pump status, connection status and water level
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [waterLevel, setWaterLevel] = useState(45); // percentage
  const [wifiConnected, setWifiConnected] = useState(true);
  const [espConnected, setEspConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEventKey, setCurrentEventKey] = useState<string | null>(null);

  // Animated water level
  const animatedLevel = useSharedValue(waterLevel);

  useEffect(() => {
    // Reference to the device status in Firebase
    const deviceStatusRef = ref(database, 'devices/device1/status');

    // Create a real-time listener for device status changes
    const unsubscribe = onValue(deviceStatusRef, (snapshot) => {
      try {
        setIsLoading(true);
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log('Device status:', data);
          // Update state with real data
          setIsPumpOn(data.isPumpOn);
          setWaterLevel(data.waterLevel);
          animatedLevel.value = withTiming(data.waterLevel, { duration: 1000 });
          setWifiConnected(data.wifiConnected);
          setEspConnected(data.espConnected);
          // Set current event key if exists
          if (data.currentEventKey) {
            setCurrentEventKey(data.currentEventKey);
          }
          setError(null);
        } else {
          setError("No device data found");
          console.log("No device data found");
        }
      } catch (err) {
        setError(`Failed to load device data: ${err instanceof Error ? err.message : String(err)}`);
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

  // System status based on water level and pump
  const getSystemStatus = () => {
    if (isPumpOn) return 'Đang bơm';
    if (waterLevel >= 90) return 'Đã đầy nước';
    return 'Đang chờ';
  };

  // Get status color
  const getStatusColor = () => {
    if (isPumpOn) return '#4FB3D0'; // Blue for pumping
    if (waterLevel >= 90) return '#5CB85C'; // Green for full
    if (waterLevel <= 20) return '#D9534F'; // Red for low water
    return '#F0AD4E'; // Yellow for waiting
  };

  // Toggle pump state and update Firebase
  const togglePump = async () => {
    try {
      const newPumpState = !isPumpOn;

      if (newPumpState) {
        // Create a new event key
        const newEventKey = `evt_${Date.now()}`;
        setCurrentEventKey(newEventKey);
        // Create a new event in history
        const eventsRef = ref(database, 'history/device1/events');
        
        const historyUpdate = {} as any;
        historyUpdate[newEventKey] = {
          mode: 'MANUAL',
          waterLevel: waterLevel,
          duration: 0,
          amountLiters: 0,
          startPump: new Date().toISOString(),
          endPump: new Date().toISOString(),
        };
        await update(eventsRef, historyUpdate);
      } else {
        // get the current event key
        const currentEventRef = ref(database, `history/device1/events/${currentEventKey}`);
        const snapshot = await get(currentEventRef);
        if (snapshot.exists()) {
          const currentEvent = snapshot.val();
          const duration = Math.floor((new Date().getTime() - new Date(currentEvent.startPump).getTime()) / 1000);
          const amountLiters = Math.round((duration / 3600) * 10); // Example calculation
          
          console.log("update duration and amountLiters :" + duration + " " + amountLiters)

          // Update the event with duration and amount
          await update(currentEventRef, {
            duration: duration || 0,
            amountLiters: amountLiters
          });
        }        
      }

      // Update local state
      setIsPumpOn(newPumpState);
      
      // Update Firebase
      const deviceStatusRef = ref(database, 'devices/device1/status');
      await update(deviceStatusRef, {
        isPumpOn: newPumpState,
        lastUpdated: new Date().toISOString()
      });      
    } catch (err) {
      setError(`Failed to toggle pump: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // This function would be used for testing or manual updates
  const changeWaterLevel = async (newLevel: number) => {
    try {
      // Update local state
      setWaterLevel(newLevel);
      animatedLevel.value = withTiming(newLevel, { duration: 1000 });
      
      // Update Firebase
      const deviceStatusRef = ref(database, 'devices/device1/status');
      await update(deviceStatusRef, {
        waterLevel: newLevel,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      setError(`Failed to update water level: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return {
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
  };
}
