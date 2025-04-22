import { useState, useEffect } from 'react';
import { database } from '@/firebaseConfig';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';

// Kiểu dữ liệu cho lịch sử bơm nước
export type PumpEvent = {
  id: string;
  date: string;
  time: string;
  duration: string;
  amountLiters: number;
  isAuto: boolean;
  startPump: string;
  endPump: string;
};

// Kiểu dữ liệu cho biểu đồ
export type ChartDataPoint = {
  day: string;
  value: number;
};

// Kiểu dữ liệu mới cho biểu đồ cột chồng
export type StackedChartDataPoint = {
  day: string;
  totalValue: number;
  segments: {
    id: string;
    value: number;
    color: string;
    time: string;
  }[];
};

export function useHistory() {
  const [pumpEvents, setPumpEvents] = useState<PumpEvent[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stackedChartData, setStackedChartData] = useState<StackedChartDataPoint[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalWater, setTotalWater] = useState(0);
  const [maxValue, setMaxValue] = useState(0);

  const formatDateAndTime = (timestamp: string) => {
    if (!timestamp) return { date: 'Unknown', time: 'Unknown' };

    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0 phút';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} phút`;
  };

  const isAutoMode = (mode: string) => mode === 'AUTO';

  // Hàm tạo màu ngẫu nhiên pastel
  const generatePastelColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  };

  useEffect(() => {
    const eventsRef = query(
      ref(database, 'history/device1/events'),
      orderByChild('timestamp'),
      limitToLast(20)
    );

    const unsubscribe = onValue(
      eventsRef,
      (snapshot) => {
        setIsLoading(true);
        try {
          if (!snapshot.exists()) {
            setPumpEvents([]);
            setChartData([]);
            setStackedChartData([]);
            setTotalWater(0);
            setMaxValue(0);
            return;
          }

          const eventsData = snapshot.val();
          const formattedEvents: PumpEvent[] = [];
          const chartSummary: { [key: string]: number } = {};
          // Dữ liệu cho biểu đồ cột chồng
          const stackedChartSummary: { [key: string]: { totalValue: number, segments: any[] } } = {};

          Object.entries(eventsData).forEach(([key, event]: any) => {
            const { date, time } = formatDateAndTime(event.startPump);

            const pumpEvent = {
              id: key,
              date,
              time,
              duration: formatDuration(event.duration),
              amountLiters: event.amountLiters || 0,
              isAuto: isAutoMode(event.mode),
              startPump: event.startPump,
              endPump: event.endPump,
            };

            formattedEvents.push(pumpEvent);

            // Cộng dồn lượng nước theo ngày
            chartSummary[date] = (chartSummary[date] || 0) + (event.amountLiters || 0);
            
            // Thêm từng đoạn cột cho biểu đồ cột chồng
            if (!stackedChartSummary[date]) {
              stackedChartSummary[date] = { totalValue: 0, segments: [] };
            }
            
            stackedChartSummary[date].segments.push({
              id: key,
              value: event.amountLiters || 0,
              color: generatePastelColor(),
              time: time,
            });
            
            stackedChartSummary[date].totalValue += (event.amountLiters || 0);
          });

          // Tạo mảng dữ liệu cho biểu đồ
          const newChartData: ChartDataPoint[] = Object.entries(chartSummary).map(
            ([day, value]) => ({
              day,
              value,
            })
          );
          
          // Tạo mảng dữ liệu cho biểu đồ cột chồng
          const newStackedChartData: StackedChartDataPoint[] = Object.entries(stackedChartSummary).map(
            ([day, data]) => ({
              day,
              totalValue: data.totalValue,
              segments: data.segments
            })
          );

          // Sắp xếp các sự kiện theo thời gian giảm dần
          formattedEvents.sort(
            (a, b) => new Date(b.startPump).getTime() - new Date(a.startPump).getTime()
          );

          // Tính toán tổng lượng nước và giá trị lớn nhất
          const total = newChartData.reduce((sum, item) => sum + item.value, 0);
          const max = newChartData.reduce((max, item) => Math.max(max, item.value), 0);
          
          const parseDateString = (dateStr: string) => {
            const [day, month, year] = dateStr.split('/');
            return new Date(Number(year), Number(month) - 1, Number(day));
          };
          
          // Sắp xếp dữ liệu biểu đồ theo thời gian tăng dần
          newChartData.sort((a, b) => {
            const dateA = parseDateString(a.day);
            const dateB = parseDateString(b.day);
            return dateA.getTime() - dateB.getTime();
          });
          
          newStackedChartData.sort((a, b) => {
            const dateA = parseDateString(a.day);
            const dateB = parseDateString(b.day);
            return dateA.getTime() - dateB.getTime();
          });

          // Cập nhật state
          setPumpEvents(formattedEvents);
          setChartData(newChartData);
          setStackedChartData(newStackedChartData);
          setTotalWater(total);
          setMaxValue(max);
          setError(null);
        } catch (err) {
          setError(`Failed to load pump events: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setError(`Events database error: ${error.message}`);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    pumpEvents,
    chartData,
    stackedChartData,
    viewMode,
    setViewMode,
    maxValue,
    totalWater,
    isLoading,
    error,
  };
}
