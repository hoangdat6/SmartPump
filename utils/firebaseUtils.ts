import { database } from '@/firebaseConfig';
import { ref, get, set, onValue } from 'firebase/database';

/**
 * Kiểm tra và khởi tạo dữ liệu mặc định nếu database rỗng
 */
export const initDeviceStatus = async (): Promise<void> => {
    try {
        console.log("Checking database status...");

        // Kiểm tra xem database đã có dữ liệu chưa
        const devicesRef = ref(database, 'devices');
        const snapshot = await get(devicesRef);

        if (!snapshot.exists()) {
            console.log("Database empty, initializing with default data...");

            // Dữ liệu mặc định cho thiết bị
            const initialData = {
                devices: {
                    device1: {
                        name: "Máy bơm nhà",
                        status: {
                            connected: true,
                            isPumpOn: false,
                            waterLevel: 45,
                            wifiConnected: true,
                            espConnected: true,
                            currentEventKey: null,
                            lastUpdated: new Date().toISOString()
                        },
                        settings: {
                            isAutoMode: true,
                            minWaterLevel: 20,
                            maxWaterLevel: 90,
                            notificationsEnabled: true,
                            lowWaterAlert: true,
                            pumpingAlert: true,
                            connectionAlert: true
                        }
                    }
                },
                history: {
                    device1: {
                        events: {
                            // Tạo một sự kiện khởi tạo
                            [`evt_${Date.now()}`]: {
                                timestamp: new Date().toISOString(),
                                action: "SYSTEM_INIT",
                                mode: "AUTO",
                                waterLevel: 45,
                                duration: 0,
                                amountLiters: 0
                            }
                        },
                    }
                },
                notifications: {
                    device1: {
                        // Tạo một thông báo khởi tạo
                        [`ntf_${Date.now()}`]: {
                            id: `ntf_${Date.now()}`,
                            title: "Hệ thống đã sẵn sàng",
                            message: "Hệ thống giám sát và điều khiển máy bơm đã được khởi tạo thành công.",
                            timestamp: new Date().toISOString(),
                            type: "info",
                            read: false,
                            relatedEvent: null
                        }
                    }
                },
                users: {
                    user123: {
                        name: "Người Dùng",
                        email: "user@example.com",
                        devices: {
                            device1: true
                        },
                        settings: {
                            theme: "light",
                            language: "vi"
                        }
                    }
                }
            };

            // Ghi dữ liệu vào database
            await set(ref(database), initialData);
            console.log("Database initialized with default data!");
            return;
        }

        console.log("Database already has data, no initialization needed.");

        // Kiểm tra và khởi tạo các thành phần cụ thể nếu chúng không tồn tại
        await ensureNodeExists('devices/device1');
        await ensureNodeExists('history/device1');
        await ensureNodeExists('notifications/device1');
        await ensureNodeExists('users/user123');

    } catch (error) {
        console.error("Error initializing database:", error);
        throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Kiểm tra và tạo nút nếu không tồn tại
 */
const ensureNodeExists = async (path: string): Promise<void> => {
    const nodeRef = ref(database, path);
    const snapshot = await get(nodeRef);

    if (!snapshot.exists()) {
        console.log(`Node ${path} doesn't exist, creating...`);

        // Tạo dữ liệu mặc định dựa trên đường dẫn
        let defaultData: any = {};

        if (path === 'devices/device1') {
            defaultData = {
                name: "Máy bơm nhà",
                status: {
                    connected: true,
                    isPumpOn: false,
                    waterLevel: 45,
                    wifiConnected: true,
                    espConnected: true,
                    currentEventKey: null,
                    lastUpdated: new Date().toISOString()
                },
                settings: {
                    isAutoMode: true,
                    minWaterLevel: 20,
                    maxWaterLevel: 90,
                    notificationsEnabled: true,
                    lowWaterAlert: true,
                    pumpingAlert: true,
                    connectionAlert: true
                }
            };
        } else if (path === 'history/device1') {
            defaultData = {
                events: {},
                dailySummary: {}
            };
        } else if (path === 'notifications/device1') {
            defaultData = {};
        } else if (path === 'users/user123') {
            defaultData = {
                name: "Người Dùng",
                email: "user@example.com",
                devices: {
                    device1: true
                },
                settings: {
                    theme: "light",
                    language: "vi"
                }
            };
        }

        await set(nodeRef, defaultData);
        console.log(`Created node at ${path}`);
    }
};

/**
 * Theo dõi cập nhật cấp độ nước và tự động bật/tắt bơm dựa trên cài đặt
 */
export const setupAutoMode = (): (() => void) => {
    const statusRef = ref(database, 'devices/device1/status');
    const settingsRef = ref(database, 'devices/device1/settings');

    let settings: any = {};
    let isSettingsLoaded = false;

    // Lắng nghe cập nhật cài đặt
    const settingsUnsubscribe = onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
            settings = snapshot.val();
            isSettingsLoaded = true;
        }
    });

    // Lắng nghe cập nhật trạng thái
    const statusUnsubscribe = onValue(statusRef, async (snapshot) => {
        if (!isSettingsLoaded || !settings.isAutoMode) return;

        if (snapshot.exists()) {
            const status = snapshot.val();

            // Nếu mực nước quá thấp và bơm chưa bật
            if (status.waterLevel <= settings.minWaterLevel && !status.isPumpOn) {
                console.log("Auto mode: Water level too low, turning pump ON");
                // Tự động bật bơm
                await set(ref(database, 'devices/device1/status/isPumpOn'), true);
                await set(ref(database, 'devices/device1/status/lastUpdated'), new Date().toISOString());

                // Tạo sự kiện mới
                await createPumpEvent('PUMP_ON', 'AUTO', status.waterLevel);

                // Tạo thông báo
                await createNotification(
                    "Bơm đã tự động bật",
                    `Mực nước xuống dưới ${settings.minWaterLevel}%. Hệ thống tự động bật bơm.`,
                    "info"
                );
            }

            // Nếu mực nước đã đầy và bơm đang bật
            else if (status.waterLevel >= settings.maxWaterLevel && status.isPumpOn) {
                console.log("Auto mode: Water level reached maximum, turning pump OFF");
                // Tự động tắt bơm
                await set(ref(database, 'devices/device1/status/isPumpOn'), false);
                await set(ref(database, 'devices/device1/status/lastUpdated'), new Date().toISOString());

                // Tạo sự kiện mới
                await createPumpEvent('PUMP_OFF', 'AUTO', status.waterLevel);

                // Tạo thông báo
                await createNotification(
                    "Bơm đã tự động tắt",
                    `Mực nước đã đạt ${settings.maxWaterLevel}%. Hệ thống tự động tắt bơm.`,
                    "success"
                );
            }
        }
    });

    // Trả về hàm để hủy đăng ký lắng nghe khi không cần thiết
    return () => {
        settingsUnsubscribe();
        statusUnsubscribe();
    };
};

/**
 * Tạo sự kiện bơm mới
 */
const createPumpEvent = async (action: string, mode: string, waterLevel: number): Promise<void> => {
    const eventsRef = ref(database, 'history/device1/events');
    const newEventKey = `evt_${Date.now()}`;

    const event = {
        timestamp: new Date().toISOString(),
        action,
        mode,
        waterLevel,
        duration: action === 'PUMP_OFF' ? 0 : 0, // Sẽ cập nhật sau khi bơm tắt
        amountLiters: action === 'PUMP_OFF' ? 0 : 0 // Sẽ cập nhật sau khi bơm tắt
    };

    await set(ref(database, `history/device1/events/${newEventKey}`), event);
    return;
};

/**
 * Tạo thông báo mới
 */
const createNotification = async (title: string, message: string, type: string): Promise<void> => {
    const notificationsRef = ref(database, 'notifications/device1');
    const newNotificationKey = `ntf_${Date.now()}`;

    const notification = {
        id: newNotificationKey,
        title,
        message,
        timestamp: new Date().toISOString(),
        type,
        read: false,
        relatedEvent: null
    };

    await set(ref(database, `notifications/device1/${newNotificationKey}`), notification);
    return;
};
