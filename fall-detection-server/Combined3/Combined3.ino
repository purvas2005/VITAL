#include <Wire.h>
#include <MPU6050_tockn.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SoftwareSerial.h>
#include <TinyGPS++.h>

// WiFi Credentials
const char* ssid = "Airtel_pari_1963";
const char* password = "air60359";

// GPS and Serial Setup
TinyGPSPlus gps;
SoftwareSerial gpsSerial(4, 5);  // RX, TX
WiFiClientSecure espClient;

// GPS + WiFi
unsigned long lastSendTime = 0;
bool firstTimeFlag = false;

// MPU6050
MPU6050 mpu6050(Wire);
const float ACC_THRESHOLD = 2.5;
const float GYRO_THRESHOLD = 70;

// MAX30102
MAX30105 particleSensor;
const byte RATE_SIZE = 10;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg;
float temperature;
int oxygen;

// Timing
unsigned long lastPrintTime = 0;
const unsigned long PRINT_INTERVAL = 1000;

void setup() {
  Serial.begin(115200);
  
  // --- Connect WiFi First ---
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\n✅ Connected to WiFi!");

  // --- Init I2C ---
  Wire.begin(4, 5); // SDA, SCL (ESP8266)

  // --- GPS Setup ---
  gpsSerial.begin(9600);
  Serial.println("Waiting for GPS Satellite signal...");

  // --- MPU6050 Setup ---
  mpu6050.begin();
  Serial.println("Calibrating gyroscope...");
  mpu6050.calcGyroOffsets(true);
  Serial.println("✅ MPU6050 ready.");

  // --- MAX30102 Setup ---
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("❌ MAX30102 not found. Continuing without it.");
  } else {
    Serial.println("✅ MAX30102 initialized.");
    particleSensor.setup(60, 4, 2, 100, 411, 4096);
    temperature = particleSensor.readTemperature();
    Serial.print("Temperature = "); Serial.print(temperature, 2); Serial.println(" °C");
  }

  for (byte i = 0; i < RATE_SIZE; i++) rates[i] = 0;
  Serial.println("Place your finger on the sensor with steady pressure.");
}

void sendLocationToServer(float lat, float lon) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient wifiClient;
    HTTPClient http;

    String url = "http://192.168.222.145:3000/fall-alert"; // change to your server IP
    http.begin(wifiClient, url);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"latitude\": " + String(lat, 6) + ", \"longitude\": " + String(lon, 6) + "}";
    int httpCode = http.POST(jsonPayload);

    Serial.println("Sending location: " + jsonPayload);
    Serial.println("HTTP Code: " + String(httpCode));

    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
    } else {
      Serial.println("Failed to send: " + http.errorToString(httpCode));
    }
    http.end();
  }
}

void loop() {
  // --- MPU6050 Fall Detection ---
  mpu6050.update();
  float accX = mpu6050.getAccX();
  float accY = mpu6050.getAccY();
  float accZ = mpu6050.getAccZ();
  float gyroX = mpu6050.getGyroX();
  float gyroY = mpu6050.getGyroY();
  float gyroZ = mpu6050.getGyroZ();

  float accMagnitude = sqrt(accX * accX + accY * accY + accZ * accZ);
  float gyroMagnitude = sqrt(gyroX * gyroX + gyroY * gyroY + gyroZ * gyroZ);

  bool fallDetected = (accMagnitude > ACC_THRESHOLD || gyroMagnitude > GYRO_THRESHOLD);

  // --- MAX30102 Heart Rate + SpO2 ---
  long irValue = particleSensor.getIR();
  long redValue = particleSensor.getRed();

  if (irValue < 50000) {
    Serial.println("No finger detected.");
    for (byte i = 0; i < RATE_SIZE; i++) rates[i] = 0;
    rateSpot = 0;
    beatAvg = 0;
    beatsPerMinute = 0;
    lastBeat = 0;
  }

  if (checkForBeat(irValue)) {
    long delta = millis() - lastBeat;
    lastBeat = millis();
    beatsPerMinute = 60 / (delta / 1000.0);
    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;
      beatAvg = 0;
      byte validRates = 0;
      for (byte x = 0; x < RATE_SIZE; x++) {
        if (rates[x] > 0) {
          beatAvg += rates[x];
          validRates++;
        }
      }
      if (validRates > 0) beatAvg /= validRates;
    }
  }

  if (irValue > 50000 && redValue > 50000) {
    float ratio = (float)redValue / (float)irValue;
    oxygen = 110 - 25 * ratio;
    oxygen = constrain(oxygen, 0, 100);
  } else {
    oxygen = 0;
  }

  // --- GPS Data Read ---
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  float Latitude, Longitude;

  if (gps.location.isValid()) {
    Latitude = gps.location.lat();
    Longitude = gps.location.lng();
    Serial.println("✅ Using real-time GPS data.");
  } else {
    Latitude = 12.971599;   // Hardcoded for testing
    Longitude = 77.594566;
    Serial.println("⚠️ Using hardcoded location for testing.");
  }

  // --- Serial Output ---
  if (millis() - lastPrintTime > PRINT_INTERVAL) {
    Serial.println("\n--- Health Monitor Readings ---");
    Serial.print("Acc Magnitude: "); Serial.println(accMagnitude);
    Serial.print("Gyro Magnitude: "); Serial.println(gyroMagnitude);
    Serial.print("IR="); Serial.print(irValue);
    Serial.print(", BPM="); Serial.print(beatsPerMinute, 1);
    Serial.print(", Avg BPM="); Serial.print(beatAvg);
    Serial.print(", SpO2="); Serial.print(oxygen); Serial.println("%");
    Serial.print("Latitude: "); Serial.println(Latitude, 6);
    Serial.print("Longitude: "); Serial.println(Longitude, 6);

    if (fallDetected) Serial.println("⚠️ FALL DETECTED!");
    if (beatAvg > 0 && beatAvg < 50) Serial.println("⚠️ Low Heart Rate Detected!");
    if (oxygen < 90 && oxygen > 0) Serial.println("⚠️ Low SpO₂ Detected!");
    else if (oxygen >= 90 && oxygen < 95) Serial.println("SpO₂ Slightly Low - Please Monitor");

    Serial.println("------------------------------");
    lastPrintTime = millis();
  }

  // --- Send Location if Fall Detected ---
  if (fallDetected && (millis() - lastSendTime > 60000 || !firstTimeFlag)) {
    sendLocationToServer(Latitude, Longitude);
    lastSendTime = millis();
    firstTimeFlag = true;
  }

  delay(100);
}
