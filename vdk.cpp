#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>

// ——— Cấu hình chân và cảm biến ———
#define TRIG_PIN     D1
#define ECHO_PIN     D2
#define RELAY_PIN    D5
#define WINDOW_SIZE  5

float distanceBuffer[WINDOW_SIZE];
int bufferIndex = 0;

// ——— Thông số bể ———
float tankHeight      = 7.0;    // cm
float sensorToBottom  = 14.05;  // cm

int thresholdOn  = 0;  // minWaterLevel
int thresholdOff = 100;  // maxWaterLevel
float pumpFlowLpm = 1.6;

const float supplyV = 5.0; 
String pumpStartTime;

// ——— WiFi ———
const char* ssid     = "Tuan";
const char* password = "dotuangv2";

// ——— Firebase ———
#define API_KEY "AIzaSyAB3bnqfreZFXxbKjlB9JjGtlH_8R3ZHYc"  // API Key từ Firebase project
#define DATABASE_URL "vdk10-14d72-default-rtdb.asia-southeast1.firebasedatabase.app"  // URL Firebase Realtime Database
FirebaseData fbdo;
FirebaseJson json;
FirebaseConfig config;
FirebaseAuth auth;

unsigned long lastCheck = 0;

// Trạng thái
bool isAuto         = false;
bool isPumping      = false;
bool useKalman      = false;
int  prevWaterLevel = -1;
bool prevPumpState  = false;
bool prevAutoMode = false;
bool isAutoPumping = false;

// Kalman vars
float kalmanEstimate      = 0;
float kalmanErrorEstimate = 1;
float kalmanQ             = 0.1;
float kalmanR             = 0.5;

// EMA
float previousDistance = 0;
float smoothingFactor = 0.2; // càng thấp càng mượt

// ——— Các hàm cơ bản ———

// Đọc khoảng cách
float getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  return duration * 0.034 / 2;
}

// Trung bình trượt
float movingAverage(float v) {
  distanceBuffer[bufferIndex] = v;
  bufferIndex = (bufferIndex + 1) % WINDOW_SIZE;
  float sum = 0;
  for (int i = 0; i < WINDOW_SIZE; i++) sum += distanceBuffer[i];
  return sum / WINDOW_SIZE;
}

// Kalman Filter
float kalmanFilter(float meas) {
  kalmanErrorEstimate += kalmanQ;
  float gain = kalmanErrorEstimate / (kalmanErrorEstimate + kalmanR);
  kalmanEstimate += gain * (meas - kalmanEstimate);
  kalmanErrorEstimate *= (1 - gain);
  return kalmanEstimate;
}

// Tính % mực nước
int calculateWaterLevelPercent(float hTank, float hSensorBottom, float dist) {
  float waterH = hSensorBottom - dist;
  waterH = constrain(waterH, 0, hTank);
  return (waterH / hTank) * 100.0;
}

// EMA
float getSmoothedDistance(float current) {
  previousDistance = previousDistance + smoothingFactor * (current - previousDistance);
  return previousDistance;
}

// Tạo timestamp ISO8601
String getISO8601Time() {
  time_t now = time(nullptr);
  struct tm* tmInfo = gmtime(&now);
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", tmInfo);
  return String(buf);
}

time_t parseISO8601(const String& isoTime) {
  struct tm tm{};
  strptime(isoTime.c_str(), "%Y-%m-%dT%H:%M:%SZ", &tm);
  return mktime(&tm);
}

String logEvent(const char* action, const char* mode, int waterLevel, int durationSec, int amountLiters, String endPump) {
  // Tạo key event dựa trên timestamp
  String evtKey = "evt_" + String(millis());
  
  // Build object JSON
  json.clear();
  // json.add("timestamp", getISO8601Time());
  // json.add("action", action);           // "PUMP_ON" / "PUMP_OFF"
  json.add("startPump", pumpStartTime);
  json.add("endPump", endPump);
  json.add("mode", mode);               // "AUTO" / "MANUAL"
  json.add("waterLevel", waterLevel);
  json.add("duration", durationSec);
  json.add("amountLiters", amountLiters);

  // Đẩy vào /history/device1/events/{evtKey}
  String path = "/history/device1/events/" + evtKey;
  Firebase.setJSON(fbdo, path.c_str(), json);
  return evtKey;
}

void sendNotification(String title, String message, String relatedEventKey, String type = "info") {
  // Tạo key notification
  String ntfKey = "ntf_" + String(millis());

  json.clear();
  json.add("id",             ntfKey);
  json.add("title",          title);
  json.add("message",        message);
  json.add("timestamp",      getISO8601Time());
  json.add("type",           type);
  json.add("read",           false);
  json.add("relatedEvent",   relatedEventKey);

  String path = "/notifications/device1/" + ntfKey;
  Firebase.setJSON(fbdo, path.c_str(), json);
}

// Điều khiển bơm tự động
bool controlPumpAuto(int lvl, bool isPumpOn) {
  if (!isPumping && lvl < thresholdOn) {
    // Bắt đầu bơm
    digitalWrite(RELAY_PIN, HIGH);
    isPumping = isPumpOn = isAutoPumping = true;
    pumpStartTime = getISO8601Time();

    // Log event PUMP_ON và notification như trước
    String evtKey = "evt_" + String(millis());
    String message = "Mực nước xuống dưới " + String(thresholdOn) + "%";
    sendNotification("Bơm đã bật", message, evtKey);
  }
  else if (isPumping && (lvl >= thresholdOff - 3) && isAutoPumping) {
    // Tính thời gian bơm (giây)
    digitalWrite(RELAY_PIN, LOW);
    String endPump = getISO8601Time();
    unsigned long durationSec   = difftime(parseISO8601(endPump), parseISO8601(pumpStartTime));
    // Tính lượng nước (lít): (L/phút) * (giây/60)
    float amountLiters = pumpFlowLpm * (durationSec / 60.0);

    // Dừng bơm
    isPumping = isPumpOn = isAutoPumping = false;
    // Log event PUMP_OFF với duration và amountLiters
    String evtKey = logEvent("PUMP_OFF", "AUTO", lvl,
             durationSec,
             round(amountLiters * 1000),
             endPump
               // chuyển sang ml nếu cần integer
    );

    // Gửi notification

    String message = "Mực nước lên tới " + String(min(lvl + 3, 100)) + "%";
    sendNotification("Bơm đã tắt", message, evtKey);
  }
  return isPumpOn;
}

void controlPumpManual(bool isPumpOn, int lvl){
  if(!isPumping && isPumpOn){
    digitalWrite(RELAY_PIN, HIGH);
    isPumping = true;
    pumpStartTime = getISO8601Time();
    String evtKey = "evt_" + String(millis());
    String message = "Mực nước xuống dưới " + String(lvl) + "%";
    sendNotification("Bơm đã bật", message, evtKey);
  }else if(isPumping && !isPumpOn){
    digitalWrite(RELAY_PIN, LOW);
    isPumping = false;
    isAutoPumping = false;
    String endPump = getISO8601Time();
    unsigned long durationSec = difftime(parseISO8601(endPump), parseISO8601(pumpStartTime));
    // Tính lượng nước (lít): (L/phút) * (giây/60)
    float amountLiters = pumpFlowLpm * (durationSec / 60.0);
    String evtKey = logEvent("PUMP_OFF", "Manual", lvl,
            durationSec,
            round(amountLiters * 1000), endPump
    );
    // Gửi notification
    String message = "Mực nước lên tới " + String(min(lvl + 2, 100)) + "%";
    sendNotification("Bơm đã tắt", message, evtKey);
  }
}

float getAverageDistance(){
  float sum = 0;
  float numReadings = 10;

  for (int i = 0; i < numReadings; i++) {
    float distance = getDistance();  // Đo khoảng cách
    if (distance > 0) {  // Kiểm tra giá trị hợp lệ
      sum += distance;
    }
    delay(50);  // Tạm dừng một chút để tránh quá nhanh
  }

  // Trả về trung bình
  return sum / numReadings;
}

void writeStatus(int lvl, bool isPumping){
  if (lvl != prevWaterLevel || isPumping != prevPumpState) {
    prevWaterLevel = lvl;
    prevPumpState  = isPumping;

    Firebase.setBool(fbdo,   "/devices/device1/status/isPumpOn",  isPumping);
    Firebase.setInt(fbdo,    "/devices/device1/status/waterLevel", lvl);
    Firebase.setString(fbdo, "/devices/device1/status/lastUpdated", getISO8601Time());

  }
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // tắt bơm lúc khởi động

  // Khởi tạo buffer moving average
  for (int i = 0; i < WINDOW_SIZE; i++) {
    distanceBuffer[i] = getDistance();
    delay(50);
  }

  // Kết nối WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Đang kết nối WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" OK");
  Serial.print("IP: "); Serial.println(WiFi.localIP());

  // Khởi tạo thời gian (NTP)
  configTime(7 * 3600, 0, "pool.ntp.org");

  // Khởi tạo Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  config.signer.test_mode = true;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  if (Firebase.ready()) {
    Serial.println("Firebase is ready!");
  } else {
    Serial.println("Firebase NOT ready!");
  }
}


void loop() {

    // Đọc sensorToBottom	và tankHeight
    if(Firebase.getDouble(fbdo, "/devices/device1/settings/tankHeight")) tankHeight = fbdo.doubleData();
    if(Firebase.getDouble(fbdo, "/devices/device1/settings/sensorToBottom")) sensorToBottom = fbdo.doubleData();

    // Đọc lưu lượng bơm
    if(Firebase.getDouble(fbdo, "/devices/device1/settings/pumpFlow")) pumpFlowLpm = fbdo.doubleData();

    // Đọc chế độ auto
    if (Firebase.getBool(fbdo, "/devices/device1/settings/isAutoMode")) isAuto = fbdo.boolData();

    // Đọc ngưỡng min/max từ settings
    if (Firebase.getInt(fbdo, "/devices/device1/settings/minWaterLevel")) thresholdOn = fbdo.intData();
    if (Firebase.getInt(fbdo, "/devices/device1/settings/maxWaterLevel")) thresholdOff = fbdo.intData();

    // Đọc waterLevel để hiển thị và ghi lại
    // float raw  = getDistance();
    // float filt = useKalman ? kalmanFilter(raw) : movingAverage(raw);
    // Serial.printf("Raw: %f,  filt: %f\n", raw, filt);
    float filt = getAverageDistance();
    // float filt = getSmoothedDistance(getDistance());
    Serial.printf(" filt: %f, Nuoc: %f", filt, sensorToBottom - filt);
    int lvl    = calculateWaterLevelPercent(tankHeight, sensorToBottom, filt);

    if (Firebase.getString(fbdo, "/devices/device1/status/isPumpOn")) {
      bool cmdPump = fbdo.boolData();
      if (isAuto) cmdPump = controlPumpAuto(lvl, cmdPump);
      controlPumpManual(cmdPump, lvl);
    }

    // Ghi lại trạng thái lên Firebase
    writeStatus(lvl, isPumping);

    // Debug
    Serial.printf("Mode:%s | Lvl:%d%% | ThOn:%d ThOff:%d | Pump:%s\n",
      isAuto ? "Auto" : "Manual",
      lvl, thresholdOn, thresholdOff,
      isPumping ? "ON" : "OFF"
    );
    // delay(200);
}
