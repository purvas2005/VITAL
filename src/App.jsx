import React, { useEffect, useState, useRef } from 'react';
import { io } from "socket.io-client";
import 'leaflet/dist/leaflet.css';

// Server URL - change this to match your server address
const SERVER_URL = "http://localhost:3000";

function App() {
  // State for health data
  const [healthData, setHealthData] = useState({
    accMagnitude: 0,
    gyroMagnitude: 0,
    heartRate: 0,
    avgHeartRate: 0,
    spo2: 0,
    temperature: 0,
    location: { latitude: 12.971599, longitude: 77.594566 },
    fallDetected: false,
    timestamp: new Date()
  });

  // State for connection status and alerts
  const [isConnected, setIsConnected] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);
  
  // References
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    // Connect to socket.io server
    socketRef.current = io(SERVER_URL);

    // Connection events
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    // Data events
    socketRef.current.on('health-update', (data) => {
      setHealthData(data);
    });

    socketRef.current.on('fall-alert', (data) => {
      // Add new alert to history
      setAlertHistory(prev => [data, ...prev.slice(0, 49)]);
      
      // Play alert sound
      playAlertSound();
    });

    // Fetch initial alert history
    fetchAlertHistory();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Initialize map after component mounts
  useEffect(() => {
    // Import Leaflet dynamically to avoid SSR issues
    import('leaflet').then((L) => {
      // Check if map already exists
      if (mapInstanceRef.current) return;
      
      // Create map
      const map = L.map(mapRef.current).setView(
        [healthData.location.latitude, healthData.location.longitude], 
        15
      );

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add marker
      const marker = L.marker([healthData.location.latitude, healthData.location.longitude]).addTo(map);
      
      // Save references
      markerRef.current = marker;
      mapInstanceRef.current = map;
    });
  }, []);

  // Update map when location changes
  useEffect(() => {
    import('leaflet').then((L) => {
      if (markerRef.current && mapInstanceRef.current && healthData.location) {
        const { latitude, longitude } = healthData.location;
        const newLatLng = [latitude, longitude];
        
        // Update marker position
        markerRef.current.setLatLng(newLatLng);
        
        // Center map on new position
        mapInstanceRef.current.setView(newLatLng, 15);
      }
    });
  }, [healthData.location]);

  // Fetch alert history from server
  const fetchAlertHistory = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/alert-history`);
      const data = await response.json();
      setAlertHistory(data);
    } catch (error) {
      console.error("Error fetching alert history:", error);
    }
  };

  // Play alert sound
  const playAlertSound = () => {
    try {
      const audio = new Audio('/alert.mp3');
      audio.play();
    } catch (e) {
      console.log('Audio play error:', e);
    }
  };

  // Get status classes based on values
  const getHeartRateClass = () => {
    if (healthData.avgHeartRate < 50 && healthData.avgHeartRate > 0) return 'text-danger';
    if (healthData.avgHeartRate > 120) return 'text-warning';
    return '';
  };

  const getSpo2Class = () => {
    if (healthData.spo2 < 90 && healthData.spo2 > 0) return 'text-danger';
    if (healthData.spo2 >= 90 && healthData.spo2 < 95) return 'text-warning';
    return '';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Health Monitor Dashboard</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <main className="dashboard-grid">
        <div className="card">
          <h2>Vital Signs</h2>
          <div className="vital-grid">
            <div className="vital-item">
              <span className="vital-label">SpO₂:</span>
              <span className={getSpo2Class()}>
                {healthData.spo2 ? `${healthData.spo2}%` : '--%'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Fall Detection</h2>
          <div className="fall-indicators">
            <div className="vital-item">
              <span className="vital-label">Acceleration:</span>
              <span>{healthData.accMagnitude ? healthData.accMagnitude.toFixed(2) : '--'}</span>
            </div>
            <div className="vital-item">
              <span className="vital-label">Gyroscope:</span>
              <span>{healthData.gyroMagnitude ? healthData.gyroMagnitude.toFixed(2) : '--'}</span>
            </div>
            <div className="status-indicator">
              <div className={`status ${healthData.fallDetected ? 'warning' : 'normal'}`}>
                {healthData.fallDetected ? 'FALL DETECTED' : 'No Fall Detected'}
              </div>
            </div>
          </div>
        </div>
        <br>
        </br>
        <div className= "card map-container">
          <h2>Location</h2>
          <div ref={mapRef} className="map"></div>
          <div className="coordinates">
            <div className="vital-item">
              <span className="vital-label">Latitude:</span>
              <span>{healthData.location.latitude.toFixed(6)}</span>
            </div>
            <div className="vital-item">
              <span className="vital-label">Longitude:</span>
              <span>{healthData.location.longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Alert History</h2>
          <div className="alert-list-container">
            <ul className="alert-list">
              {alertHistory.map((alert, index) => (
                <li key={index}>
                  <div>
                    <strong>{alert.type.toUpperCase()} ALERT</strong>
                    <div>Location: {alert.location.latitude.toFixed(6)}, {alert.location.longitude.toFixed(6)}</div>
                  </div>
                  <div>{formatTimestamp(alert.timestamp)}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;