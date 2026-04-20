import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../../lib/api';
import './MasterScheduleMatrix.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MasterScheduleMatrix({ term, academicYear }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('DayTime'); // 'DayTime' | 'RoomTime' | 'FacultyTime'

  useEffect(() => {
    if (!term || !academicYear) return;
    setLoading(true);
    apiFetch(`/api/scheduling/matrix?term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(academicYear)}`)
      .then(r => r.json())
      .then(data => {
        setEvents(data || []);
      })
      .catch(err => console.error("Matrix fetch err", err))
      .finally(() => setLoading(false));
  }, [term, academicYear]);

  // Memoization constraint to optimize heavy processing of mapped grouping elements
  const matrixData = useMemo(() => {
    // Generate display hours boundaries from 07:00 to 21:00
    const hours = Array.from({ length: 15 }, (_, i) => i + 7);
    
    let columns = [];
    if (viewMode === 'DayTime') {
      columns = DAYS.map(d => ({ id: d, label: d }));
    } else if (viewMode === 'RoomTime') {
      const roomMap = new Map();
      events.forEach(e => {
        if (e.roomId && !roomMap.has(e.roomId)) {
          roomMap.set(e.roomId, e.roomName || 'Unknown Room');
        }
      });
      columns = Array.from(roomMap.entries()).map(([id, label]) => ({ id, label }));
    } else if (viewMode === 'FacultyTime') {
      const facMap = new Map();
      events.forEach(e => {
        if (e.facultyId && !facMap.has(e.facultyId)) {
          facMap.set(e.facultyId, e.facultyName || 'Unknown Faculty');
        }
      });
      columns = Array.from(facMap.entries()).map(([id, label]) => ({ id, label }));
    }

    return { hours, columns };
  }, [events, viewMode]);

  const { hours, columns } = matrixData;

  const getEventStyle = (e) => {
    const parseTime = (t) => {
      if(!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h + m / 60;
    };
    const startHour = parseTime(e.startTime);
    const endHour = parseTime(e.endTime);
    
    // Scale: 60px per hour
    const top = (startHour - 7) * 60; 
    const height = (endHour - startHour) * 60;
    
    return { top: `${top}px`, height: `${height}px` };
  };

  return (
    <div className="schedule-matrix-container">
      <div className="matrix-controls">
         <label>Grouping View: </label>
         <select value={viewMode} onChange={e => setViewMode(e.target.value)}>
           <option value="DayTime">View by Day</option>
           <option value="RoomTime">View by Room</option>
           <option value="FacultyTime">View by Faculty</option>
         </select>
      </div>
      
      {loading ? (
         <div className="matrix-loading">Loading Matrix...</div>
      ) : (
        <div className="matrix-grid">
           <div className="matrix-time-col">
             <div className="matrix-header-cell">Time</div>
             {hours.map(h => (
               <div key={h} className="matrix-time-slot">{h}:00</div>
             ))}
           </div>
           
           <div className="matrix-columns-wrapper">
             {columns.map(col => (
               <div key={col.id} className="matrix-column">
                  <div className="matrix-header-cell">{col.label}</div>
                  <div className="matrix-events-area">
                    {/* Background grid lines */}
                    {hours.map(h => <div key={h} className="matrix-grid-line" /> )}
                    
                    {/* Position Absolute Plotted Events */}
                    {events.filter(e => {
                      if(viewMode === 'DayTime') return e.dayOfWeek === col.id;
                      if(viewMode === 'RoomTime') return e.roomId === col.id;
                      if(viewMode === 'FacultyTime') return e.facultyId === col.id;
                      return false;
                    }).map((e, idx) => (
                      <div key={idx} className="matrix-event" style={getEventStyle(e)}>
                        <div className="event-title">{e.sectionIdentifier}</div>
                        <div className="event-sub">{e.courseCode}</div>
                        {viewMode !== 'RoomTime' && <div className="event-sub">{e.roomName}</div>}
                        {viewMode !== 'FacultyTime' && <div className="event-sub">{e.facultyName}</div>}
                      </div>
                    ))}
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
