// src/components/FallMap.jsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom icon for fall alerts
const fallIcon = new L.DivIcon({
  className: 'fall-marker-icon pulse',
  iconSize: [15, 15],
});

// Component to automatically update map center
function MapUpdater({ alerts }) {
  const map = useMap();
  
  useEffect(() => {
    if (alerts.length > 0) {
      // Center map on the most recent alert
      map.setView([alerts[0].latitude, alerts[0].longitude], 15);
    }
  }, [alerts, map]);
  
  return null;
}

function FallMap({ alerts }) {
  // Default center if no alerts
  const defaultCenter = [40.7128, -74.0060]; // New York City
  const center = alerts.length > 0 ? [alerts[0].latitude, alerts[0].longitude] : defaultCenter;
  
  return (
    <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {alerts.map(alert => (
        <Marker 
          key={alert.id} 
          position={[alert.latitude, alert.longitude]}
          icon={fallIcon}
        >
          <Popup>
            <div>
              <strong>Fall Detected</strong><br />
              Time: {new Date(alert.timestamp).toLocaleTimeString()}<br />
              Latitude: {alert.latitude.toFixed(6)}<br />
              Longitude: {alert.longitude.toFixed(6)}<br />
              Satellites: {alert.satellites}
            </div>
          </Popup>
        </Marker>
      ))}
      
      <MapUpdater alerts={alerts} />
    </MapContainer>
  );
}

export default FallMap;