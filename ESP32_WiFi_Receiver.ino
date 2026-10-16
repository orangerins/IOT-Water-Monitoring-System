
#include <WiFi.h>
#include <HTTPClient.h>
#include <math.h>

HardwareSerial unoSerial(2);

// ==========================================
// WIFI AND DJANGO CONFIGURATION
// ==========================================

const char* WIFI_SSID = "DABIIDRYSTAN 2.4G";
const char* WIFI_PASSWORD = "yawamongtanan";
const char* DEVICE_TOKEN = "4d06de8be8387a686d55c9a9e805c0731b773fce88b4fec0512c638d38457c8c";

// Updated laptop IP address.
const char* SERVER_URL =
  "http://192.168.0.185:8000/api/device/readings/";

const int DEVICE_ID = 1;

const unsigned long UPLOAD_INTERVAL = 10000;
unsigned long lastUpload = 0;

String latestData = "";

// ==========================================
// READ SENSOR FIELD
// ==========================================

bool getField(String data, String key, float &result) {
  String searchKey = key + ":";
  int start = data.indexOf(searchKey);

  if (start < 0) return false;

  start += searchKey.length();

  int end = data.indexOf(',', start);
  if (end < 0) end = data.length();

  String value = data.substring(start, end);
  value.trim();

  if (value.length() == 0) return false;

  char* parseEnd;
  result = strtof(value.c_str(), &parseEnd);

  return parseEnd != value.c_str() &&
         *parseEnd == '\0' &&
         isfinite(result);
}

// ==========================================
// CONNECT TO WIFI
// ==========================================

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("Connecting to Wi-Fi...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED &&
         millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Wi-Fi connected!");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Wi-Fi connection failed.");
  }
}

// ==========================================
// UPLOAD READINGS TO DJANGO
// ==========================================

void uploadReadings(String data) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Upload skipped: Wi-Fi disconnected.");
    return;
  }

  float temperature, turbRaw, turbVoltage;
  float phRaw, phVoltage, doRaw, doVoltage;

  bool valid =
    getField(data, "TEMP", temperature) &&
    getField(data, "TURB_RAW", turbRaw) &&
    getField(data, "TURB_V", turbVoltage) &&
    getField(data, "PH_RAW", phRaw) &&
    getField(data, "PH_V", phVoltage) &&
    getField(data, "DO_RAW", doRaw) &&
    getField(data, "DO_V", doVoltage);

  if (!valid) {
    Serial.println(
      "Upload skipped: incomplete sensor data."
    );
    return;
  }

  if (
    temperature < -55 || temperature > 125 ||
    turbRaw < 0 || turbRaw > 1023 ||
    phRaw < 0 || phRaw > 1023 ||
    doRaw < 0 || doRaw > 1023 ||
    turbVoltage < 0 || turbVoltage > 5 ||
    phVoltage < 0 || phVoltage > 5 ||
    doVoltage < 0 || doVoltage > 5
  ) {
    Serial.println(
      "Upload skipped: sensor data out of range."
    );
    return;
  }

  String json = "{";

  json += "\"device_id\":" +
          String(DEVICE_ID) + ",";

  json += "\"temperature\":{\"value\":" +
          String(temperature, 2) + "},";

  json += "\"turbidity\":{\"raw_adc\":" +
          String((int)turbRaw) +
          ",\"raw_voltage\":" +
          String(turbVoltage, 2) + "},";

  json += "\"pH\":{\"raw_adc\":" +
          String((int)phRaw) +
          ",\"raw_voltage\":" +
          String(phVoltage, 2) + "},";

  json += "\"DO\":{\"raw_adc\":" +
          String((int)doRaw) +
          ",\"raw_voltage\":" +
          String(doVoltage, 2) + "}";

  json += "}";

  WiFiClient client;
  HTTPClient http;

  http.setTimeout(5000);

  if (!http.begin(client, SERVER_URL)) {
    Serial.println(
      "Unable to initialize HTTP request."
    );
    return;
  }

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  http.addHeader(
    "X-Device-Token",
    DEVICE_TOKEN
  );

  int responseCode = http.POST(json);

  Serial.print("HTTP response: ");
  Serial.println(responseCode);

  if (responseCode > 0) {
    Serial.println(http.getString());
  } else {
    Serial.println(
      http.errorToString(responseCode)
    );
  }

  http.end();
}

// ==========================================
// SETUP
// ==========================================

void setup() {
  Serial.begin(115200);

  // Arduino UNO TX (D7) through voltage
  // divider to ESP32 GPIO16.
  unoSerial.begin(
    9600,
    SERIAL_8N1,
    16,
    17
  );

  delay(1000);

  Serial.println(
    "ORANINE ESP32 WIFI UPLOADER"
  );

  connectWiFi();
}

// ==========================================
// MAIN LOOP
// ==========================================

void loop() {
  // Receive sensor data from Arduino UNO.
  while (unoSerial.available()) {
    String data =
      unoSerial.readStringUntil('\n');

    data.trim();

    if (data.startsWith("TEMP:")) {
      latestData = data;

      Serial.println("DATA FROM UNO:");
      Serial.println(latestData);
    }
  }

  // Upload latest readings every 10 seconds.
  if (
    millis() - lastUpload >= UPLOAD_INTERVAL
  ) {
    lastUpload = millis();

    if (WiFi.status() != WL_CONNECTED) {
      connectWiFi();
    }

    if (latestData.length() > 0) {
      uploadReadings(latestData);
    } else {
      Serial.println(
        "Waiting for Arduino UNO data..."
      );
    }
  }
}
