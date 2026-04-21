import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import './RoomUtilizationDashboard.css';

export default function RoomUtilizationDashboard({ term, academicYear }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emptyRoomsNow, setEmptyRoomsNow] = useState([]);

  useEffect(() => {
    if (!term || !academicYear) return;
    setLoading(true);

    apiFetch(`/api/scheduling/room-utilization?term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(academicYear)}`)
      .then(async res => {
        if (!res.ok) throw new Error('API Request Failed');
        return res.json();
      })
      .then(result => {
        const arr = Array.isArray(result) ? result : [];
        setData(arr);
        calculateEmptyRooms(arr);
      })
      .catch(err => {
        console.error("Utilization fetch err", err);
        setData([]);
      })
      .finally(() => setLoading(false));

    // Optional: Refresh empty rooms every minute
    const interval = setInterval(() => calculateEmptyRooms(data), 60000);
    return () => clearInterval(interval);
  }, [term, academicYear, data]);

  const calculateEmptyRooms = (utilData) => {
    if (!utilData || utilData.length === 0) return;
    const now = new Date();
    // In our system mock, days are 'Mon', 'Tue', etc.
    const dayStr = now.toLocaleDateString('en-US', { weekday: 'short' });
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const empty = utilData.filter(room => {
      if (!room.schedules || room.schedules.length === 0) return true;

      const isOccupiedNow = room.schedules.some(s => {
        if (s.dayOfWeek !== dayStr) return false;
        
        const parseTime = (t) => {
          if (!t) return 0;
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };
        const sMins = parseTime(s.startTime);
        const eMins = parseTime(s.endTime);
        return currentMins >= sMins && currentMins < eMins;
      });

      return !isOccupiedNow;
    });
    setEmptyRoomsNow(empty);
  };

  const getColorIntensity = (percentage) => {
    // Return heatmap style colors
    if (percentage > 80) return '#d32f2f'; // Heavy usage - Red
    if (percentage > 50) return '#f57c00'; // Moderate - Orange
    if (percentage > 20) return '#fbc02d'; // Light - Yellow
    return '#388e3c'; // Very low / Green
  };

  return (
    <div className="utilization-dashboard">
      <div className="utilization-main">
        <h2>Room Utilization Heatmap</h2>
        <p className="utilization-subtitle">Theoretical max: 60 hrs/week per room</p>
        
        {loading ? (
          <p>Loading Utilization Metrics...</p>
        ) : (
          <div className="utilization-grid">
            {data.map(room => (
              <div 
                key={room.roomId || Math.random()} 
                className="utilization-card"
                style={{ borderTop: `4px solid ${getColorIntensity(room.utilizationPercentage)}` }}
              >
                <h3>{room.roomName || 'Unassigned / Outside Facility'}</h3>
                <div className="util-stats">
                   <div className="util-stat-row">
                      <span>Total Booked:</span>
                      <strong>{room.totalScheduledHours?.toFixed(1)} hrs</strong>
                   </div>
                   <div className="util-stat-row">
                      <span>Rate:</span>
                      <strong style={{ color: getColorIntensity(room.utilizationPercentage) }}>
                        {room.utilizationPercentage?.toFixed(1)}%
                      </strong>
                   </div>
                   <div className="util-stat-row">
                      <span>Avg Capacity:</span>
                      <strong>{room.maximumCapacity || 'N/A'}</strong>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="utilization-sidebar">
        <div className="sidebar-header">
           <span className="live-indicator"></span>
           <h3>Currently Empty Now</h3>
        </div>
        <p className="sidebar-meta">Rooms accessible right now based on active timetable.</p>
        
        {emptyRoomsNow.length > 0 ? (
          <ul className="empty-rooms-list">
            {emptyRoomsNow.map(r => (
              <li key={r.roomId}>
                {r.roomName || 'Unnamed Hub'}
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-empty-rooms">
             <p>No rooms available. Peak operations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
