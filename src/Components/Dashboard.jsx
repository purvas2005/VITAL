// src/components/Dashboard.jsx
import React from 'react';
import FallMap from './FallMap';
import AlertsList from './AlertsList';
import StatusPanel from './StatusPanel';
import './Dashboard.css';

function Dashboard({ alerts, isConnected, lastUpdate, onSimulateFall }) {
  // Get the most recent alert (if any)
  const latestAlert = alerts.length > 0 ? alerts[0] : null;

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Elderly Fall Detection System</h1>
          <p className="dashboard-subtitle">Real-time monitoring dashboard</p>
        </header>
        
        <div className="dashboard-grid">
          {/* Left sidebar */}
          <div>
            <AlertsList alerts={alerts} />
            <StatusPanel 
              isConnected={isConnected} 
              lastUpdate={lastUpdate} 
              deviceCount={1}
              onSimulateFall={onSimulateFall}
            />
          </div>
          
          {/* Map and details area */}
          <div>
            <div className="map-container">
              <FallMap alerts={alerts} />
            </div>
            
            <div className="details-container">
              <h2 className="details-title">Latest Alert Details</h2>
              {latestAlert ? (
                <div className="details-grid">
                  <div className="detail-item">
                    <h3>Location</h3>
                    <p>Latitude: {latestAlert.latitude.toFixed(6)}</p>
                    <p>Longitude: {latestAlert.longitude.toFixed(6)}</p>
                  </div>
                  <div className="detail-item">
                    <h3>Time</h3>
                    <p>{new Date(latestAlert.timestamp).toLocaleTimeString()}</p>
                    <p>{new Date(latestAlert.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className="detail-item">
                    <h3>GPS Quality</h3>
                    <p>Satellites: {latestAlert.satellites}</p>
                  </div>
                  <div className="detail-item">
                    <h3>Status</h3>
                    <p className="fall-status">Fall Detected</p>
                  </div>
                </div>
              ) : (
                <p className="no-alerts">No alerts available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;