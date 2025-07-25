#include <TinyGPS++.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <Wire.h>
#include <MPU6050.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server details
const char* serverUrl = "localhost:3000/fall-alert";

// TinyGPS++ instance
TinyGPSPlus gps;

// MPU6050 instance
MPU6050 mpu;

// Fall detection variables
const float FALL_THRESHOLD = 2.5; // Adjust based on testing (in g's)
bool fallDetected = false;
unsigned long lastFallTime = 0;
const unsigned long COOLDOWN_PERIOD = 30000; // 30 seconds cooldown between alerts

// GPS variables
float latitude = 0.0;
float longitude = 0.0;
int satellites = 0;
bool gpsValid = false;

void setup() {
  Serial.begin(9600);   // For Serial Monitor
  Serial.swap();        // Swap Serial to use GPIO3 (RX) for GPS input
  
  // Initialize I2C
  Wire.begin();
  
  // Initialize MPU6050
  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("MPU6050 connection failed");
  }
  
  // Set up WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  
  Serial.println("Fall detection system initialized");
}

void loop() {
  // Read GPS data
  readGPS();
  
  // Check for falls
  checkForFall();
  
  // If a fall is detected and we have valid GPS data, send alert
  if (fallDetected && gpsValid) {
    sendFallAlert();
    fallDetected = false;
  }
}

void readGPS() {
  while (Serial.available()) {
    gps.encode(Serial.read());
  }
  
  if (gps.location.isUpdated()) {
    latitude = gps.location.lat();
    longitude = gps.location.lng();
    satellites = gps.satellites.value();
    gpsValid = true;
    
    // Debug output
    Serial.print("Latitude: ");
    Serial.println(latitude, 6);
    Serial.print("Longitude: ");
    Serial.println(longitude, 6);
    Serial.print("Satellites: ");
    Serial.println(satellites);
  }
}

void checkForFall() {
  // Get accelerometer readings
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);
  
  // Convert to g's
  float accelX = ax / 16384.0;
  float accelY = ay / 16384.0;
  float accelZ = az / 16384.0;
  
  // Calculate total acceleration magnitude
  float accelMagnitude = sqrt(accelX*accelX + accelY*accelY + accelZ*accelZ);
  
  // Check if magnitude exceeds threshold
  unsigned long currentTime = millis();
  if (accelMagnitude > FALL_THRESHOLD && currentTime - lastFallTime > COOLDOWN_PERIOD) {
    Serial.println("Fall detected!");
    Serial.print("Acceleration magnitude: ");
    Serial.println(accelMagnitude);
    
    fallDetected = true;
    lastFallTime = currentTime;
  }
}

void sendFallAlert() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient client;
    
    // Prepare URL with data
    String url = String(serverUrl) + 
                "?lat=" + String(latitude, 6) + 
                "&lng=" + String(longitude, 6) +
                "&satellites=" + String(satellites);
    
    http.begin(client, url);
    int httpCode = http.GET();
    
    if (httpCode > 0) {
      String payload = http.getString();
      Serial.println("Server response: " + payload);
    } else {
      Serial.println("HTTP request failed");
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}
