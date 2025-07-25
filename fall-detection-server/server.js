const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Store the latest health data and alert
let latestHealthData = {
  accMagnitude: 0,
  gyroMagnitude: 0,
  heartRate: 0,
  avgHeartRate: 0,
  spo2: 0,
  temperature: 0,
  location: { latitude: 0, longitude: 0 },
  fallDetected: false,
  timestamp: new Date(),
};

// Store history of alerts
const alertHistory = [];

// CSV log file path
const csvFilePath = path.join(__dirname, 'fall_log.csv');

// Helper function to log fall alert to CSV
function logFallToCSV(alert) {
  const exists = fs.existsSync(csvFilePath);
  const csvLine = `${alert.timestamp.toISOString()},${alert.location.latitude},${alert.location.longitude}\n`;

  if (!exists) {
    const headers = "timestamp,latitude,longitude\n";
    fs.writeFileSync(csvFilePath, headers + csvLine);
  } else {
    fs.appendFileSync(csvFilePath, csvLine);
  }

  console.log("✅ Fall alert logged to CSV.");
}

// Routes
app.get('/api/health-data', (req, res) => {
  res.json(latestHealthData);
});

app.get('/api/alert-history', (req, res) => {
  res.json(alertHistory);
});

// Endpoint to receive fall alerts from Arduino
app.post('/fall-alert', (req, res) => {
  const { latitude, longitude } = req.body;

  console.log(`🚨 Fall alert received! Location: ${latitude}, ${longitude}`);

  const alertData = {
    location: { latitude, longitude },
    timestamp: new Date(),
    type: 'fall'
  };

  // Add to history
  alertHistory.unshift(alertData);
  if (alertHistory.length > 50) alertHistory.pop();

  // Update latest data
  latestHealthData.location = { latitude, longitude };
  latestHealthData.fallDetected = true;
  latestHealthData.timestamp = new Date();

  // Log to CSV
  logFallToCSV(alertData);

  // Emit to all connected clients
  io.emit('fall-alert', alertData);

  res.status(200).json({ message: 'Alert received and processed' });
});

// Endpoint to receive health data from Arduino
app.post('/health-data', (req, res) => {
  const {
    accMagnitude,
    gyroMagnitude,
    heartRate,
    avgHeartRate,
    spo2,
    temperature,
    latitude,
    longitude
  } = req.body;

  latestHealthData = {
    accMagnitude,
    gyroMagnitude,
    heartRate,
    avgHeartRate,
    spo2,
    temperature,
    location: { latitude, longitude },
    fallDetected: accMagnitude > 2.5 || gyroMagnitude > 70,
    timestamp: new Date()
  };

  // Emit to all connected clients
  io.emit('health-update', latestHealthData);

  res.status(200).json({ message: 'Health data received and processed' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  // Send the latest health data to the newly connected client
  socket.emit('health-update', latestHealthData);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
