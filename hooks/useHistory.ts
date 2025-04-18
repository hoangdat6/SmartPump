import { useState, useEffect } from 'react';
import { database } from '@/firebaseConfig';
import { ref, onValue, query, orderByChild, limitToLast, set } from 'firebase/database';

import { ACTION_TYPE } from '@/constants/actionTypes';

// Sample data for pump history
export type PumpEvent = {
  id: string;
  active: ACTION_TYPE;
  date: string;
  time: string;
  duration: string;
  amountLiters: number;
  isAuto: boolean;
  timestamp: string;
};

// Chart data type
export type ChartDataPoint = {
  day: string;
  value: number;
};

export function useHistory() {
  const [pumpEvents, setPumpEvents] = useState<PumpEvent[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalWater, setTotalWater] = useState(0);
  const [maxValue, setMaxValue] = useState(0);

  // Convert Firebase timestamp to local date and time
  const formatDateAndTime = (timestamp: string) => {
    if (!timestamp) return { date: 'Unknown', time: 'Unknown' };
    
    const date = new Date(timestamp);
    const localDate = date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const localTime = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { date: localDate, time: localTime };
  };

  // Format duration in minutes
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0 phút';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} phút`;
  };

  // Determine if pump was operated in auto mode
  const isAutoMode = (mode: string) => {
    return mode === 'AUTO';
  };

  useEffect(() => {
    // Reference to pump events in Firebase
    const eventsRef = query(
      ref(database, 'history/device1/events'),
      orderByChild('timestamp'),
      limitToLast(20) // Limit to last 20 events for better performance
    );
    
    // Create a real-time listener for events
    const eventsUnsubscribe = onValue(eventsRef, (snapshot) => {
      try {
        setIsLoading(true);
        setTotalWater(0);
        setMaxValue(0);
        setChartData([]);
        if (snapshot.exists()) {
          const eventsData = snapshot.val();
          const formattedEvents: PumpEvent[] = [];
          
          // Process and format the events data
          Object.keys(eventsData).forEach(key => {
            // select event data
            const event = eventsData[key];
            const { date, time } = formatDateAndTime(event.timestamp);
            
            if (event.action == "PUMP_ON") return; // Skip if action is not defined

            formattedEvents.push({
              id: key,
              active: event.action,
              date,
              time,
              duration: formatDuration(event.duration),
              amountLiters: event.amountLiters || 0,
              isAuto: isAutoMode(event.mode),
              timestamp: event.timestamp
            });

            // summary data for chart
            const chartDataPoint: ChartDataPoint = {
              day: date,
              value: event.amountLiters || 0
            };
            const totalWaterValue = chartDataPoint.value;
            setTotalWater(prevTotal => prevTotal + totalWaterValue);
            setMaxValue(prevMax => Math.max(prevMax, totalWaterValue));
            // Update chart data
            setChartData(prevData => {
              console.log('prevData', prevData);
              console.log('chartDataPoint', chartDataPoint);
              const existingPoint = prevData.find(point => point.day === date);
              if (existingPoint) {
                existingPoint.value += chartDataPoint.value;
              } else {
                return [...prevData, chartDataPoint];
              }
              return prevData;
            });
          });
          
          // Sort events by timestamp (newest first)
          formattedEvents.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          setPumpEvents(formattedEvents);
          setError(null);
        } else {
          setPumpEvents([]);
        }
      } catch (err) {
        setError(`Failed to load pump events: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      setError(`Events database error: ${error.message}`);
      setIsLoading(false);
    });

    // Clean up the listeners on unmount
    return () => {
      eventsUnsubscribe();
    };
  }, []);

  return {
    pumpEvents,
    chartData,
    viewMode,
    setViewMode,
    maxValue: maxValue > 0 ? maxValue : 100, // Ensure a non-zero value for chart scaling
    totalWater,
    isLoading,
    error,
  };
}
