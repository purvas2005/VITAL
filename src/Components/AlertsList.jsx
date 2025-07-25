// src/components/AlertsList.jsx
import React from 'react';
import './AlertsList.css';

function AlertsList({ alerts }) {
  return (
    <div className="alerts-container">
      <h2 className="alerts-title">Fall Alerts</h2>
      <div className="alerts-list">
        {alerts.length === 0 && (
          <p className="no-alerts">No alerts received yet.</p>
        )}
        
        {alerts.map(alert => (
          <div key={alert.id} className="alert-item">
            <div className="alert-header">
              <span className="alert-id">Alert #{alert.id.toString().slice(-4)}</span>
              <span className="alert-time">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="alert-details">
              <div>Lat: {alert.latitude.toFixed(6)}</div>
              <div>Lng: {alert.longitude.toFixed(6)}</div>
              <div>Satellites: {alert.satellites}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertsList;