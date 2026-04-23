import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../../lib/api';
import './MasterScheduleMatrix.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const START_HOUR = 7;
const END_HOUR = 17;
const PIXELS_PER_HOUR = 60;

const formatHour12 = (hour24) => {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:00 ${period}`;
};

const formatTime12 = (hhmm) => {
  if (!hhmm || !String(hhmm).includes(':')) return hhmm || '';
  const [hRaw, mRaw] = String(hhmm).split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
};

export default function MasterScheduleMatrix({ term, academicYear }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('DayTime'); // 'DayTime' | 'RoomTime' | 'FacultyTime'

  useEffect(() => {
    if (!term || !academicYear) return;
    setLoading(true);
    apiFetch(`/api/scheduling/matrix?term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(academicYear)}`)
      .then(async r => {
        if (!r.ok) throw new Error('API Request Failed');
        return r.json();
      })
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Matrix fetch err", err);
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, [term, academicYear]);

  // Memoization constraint to optimize heavy processing of mapped grouping elements
  const matrixData = useMemo(() => {
    // Generate display hour boundaries from 06:00 to 22:00
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
    
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

  const isSameId = (left, right) => String(left || '') === String(right || '');

  const getEventStyle = (e) => {
    const parseTime = (t) => {
      if(!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h + m / 60;
    };
    const startHour = parseTime(e.startTime);
    const endHour = parseTime(e.endTime);
    const clampedStart = Math.max(startHour, START_HOUR);
    const clampedEnd = Math.min(endHour, END_HOUR + 1);
    
    // Scale: 60px per hour anchored to START_HOUR
    const top = (clampedStart - START_HOUR) * PIXELS_PER_HOUR;
    const height = Math.max((clampedEnd - clampedStart) * PIXELS_PER_HOUR, 20);
    
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
               <div key={h} className="matrix-time-slot">{formatHour12(h)}</div>
             ))}
           </div>
           
           <div className="matrix-columns-wrapper">
             {columns.map(col => (
               <div key={col.id} className="matrix-column">
                  <div className="matrix-header-cell">{col.label}</div>
                 <div className="matrix-events-area" style={{ '--matrix-height': `${hours.length * PIXELS_PER_HOUR}px` }}>
                    {/* Background grid lines */}
                    {hours.map(h => <div key={h} className="matrix-grid-line" /> )}
                    
                    {/* Position Absolute Plotted Events */}
                    {events.filter((e) => {
                      if (viewMode === 'DayTime') {
                        return String(e.dayOfWeek || '').toLowerCase() === String(col.id || '').toLowerCase();
                      }
                      if (viewMode === 'RoomTime') {
                        return isSameId(e.roomId, col.id);
                      }
                      if (viewMode === 'FacultyTime') {
                        return isSameId(e.facultyId, col.id);
                      }
                      return false;
                    }).map((e, idx) => (
                      <div key={idx} className="matrix-event" style={getEventStyle(e)}>
                        <div className="event-title">{e.sectionIdentifier}</div>
                        <div className="event-time">{formatTime12(e.startTime)} - {formatTime12(e.endTime)}</div>
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
