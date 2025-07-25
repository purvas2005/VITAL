# 🩺 Health & Motion Monitoring System

A full-stack IoT-based health and motion monitoring system using **Arduino**, **Node.js**, and **React**. This project collects real-time data from various physiological and motion sensors, and displays it in a web interface for remote health tracking and emergency detection.

---

## ⚙️ Project Overview

This system gathers data from three sensors connected to an Arduino:

- **Gyroscope (e.g., MPU6050)** – Detects motion and orientation for fall detection.
- **Pulse Sensor** – Monitors real-time heart rate.
- **GPS Module (e.g., NEO-6M)** – Captures location data in case of an emergency.

Data is sent via serial or Wi-Fi to a **Node.js** server, which stores, processes, and forwards it to a **React-based web dashboard** for visualization.

---

## 🧩 Tech Stack

### 🖥️ Frontend
- **React.js**
- Charting (e.g., Recharts / Chart.js)
- Live location and status display

### 🌐 Backend
- **Node.js**
- **Express**
- MongoDB or local JSON for data storage

### 🔌 Hardware & Firmware
- **Arduino Uno / ESP8266 / ESP32**
- MPU6050 Gyroscope/Accelerometer
- Pulse Sensor
- NEO-6M GPS Module
- C++ (Arduino sketches)

---

## 🚀 How It Works

1. **Arduino** reads sensor data and sends it via serial or Wi-Fi.
2. **Node.js Server** receives and parses this data.
3. Parsed data is:
   - Stored in a database or JSON file
   - Optionally triggers alerts (e.g., fall detected)
   - Sent to the React frontend
4. **React Dashboard** displays:
   - Live pulse rate
   - Movement status
   - Last known GPS location on a map

---

## 🔧 Setup Instructions

### 1. Arduino
- Flash the board with the provided `.ino` sketch
- Connect sensors as per the schematic
- Configure serial/Wi-Fi connection to match the backend's expectations

### 2. Backend
```bash
cd server
npm install
node index.js
```

### 3. Frontend
```bash
cd client
npm install
npm start
```

### 4. Folder Structure
```bash
project-root/
├── arduino/              # Arduino sketches
├── server/               # Node.js backend
│   ├── index.js
│   └── ...
├── client/               # React frontend
│   ├── src/
│   └── ...
└── README.md

```
