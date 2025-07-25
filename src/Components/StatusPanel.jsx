// src/components/StatusPanel.jsx
import React from 'react';
import './StatusPanel.css';

function StatusPanel({ isConnected, lastUpdate, deviceCount, onSimulateFall }) {
  return (
    <div className="status-container">
      <h2 className="status-title">System Status</h2>
      <div className="status-list">
        <div className="status-item">
          <span className="status-label">Connection:</span>
          <span className={`status-value ${isConnected ? "connected" : "disconnected"}`}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Last Update:</span>
          <span className="status-value">{lastUpdate}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Active Devices:</span>
          <span className="status-value">{deviceCount}</span>
        </div>
        
        {/* For demo purposes only */}
        <button 
          onClick={onSimulateFall}
          className="alert-button"
        >
          Simulate Fall Alert
        </button>
      </div>
    </div>
  );
}

export default StatusPanel;