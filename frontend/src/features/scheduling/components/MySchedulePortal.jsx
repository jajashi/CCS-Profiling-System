import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import './MySchedulePortal.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MySchedulePortal() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Hardcoding a generic term for demo/faculty usage or it could be a state selector
    apiFetch(`/api/scheduling/my-schedule?term=1st Term`)
      .then(r => {
        if (!r.ok) {
           throw new Error('Could not load schedule. Ensure you are logged in as a faculty member.');
        }
        return r.json();
      })
      .then(data => setEvents(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="my-schedule-portal error-state">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  // Pre-calculate heights and offsets to plot events precisely on a CSS grid
  const getEventStyle = (e) => {
    const parseTime = (t) => {
      if(!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h + m / 60;
    };
    const startHour = parseTime(e.startTime);
    const endHour = parseTime(e.endTime);
    
    // Scale: 60px per hour, start from 07:00
    const top = (startHour - 7) * 70; 
    const height = (endHour - startHour) * 70;
    
    return { top: `${top}px`, height: `${height}px` };
  };

  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  return (
    <div className="my-schedule-portal">
      <div className="portal-header">
        <h2>My Schedule</h2>
        <p>Read-only timetable view of your assigned classes.</p>
      </div>

      {loading ? (
        <div className="portal-loading">Loading your timetable...</div>
      ) : (
        <div className="portal-timetable">
          <div className="timetable-time-axis">
            <div className="timetable-cell-header">Time</div>
            {hours.map(h => (
              <div key={h} className="timetable-hour-slot">
                 {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div className="timetable-days-container">
            {DAYS.map(day => {
               const dayEvents = events.filter(e => e.dayOfWeek === day);
               
               return (
                 <div key={day} className="timetable-day-column">
                   <div className="timetable-cell-header">{day}</div>
                   <div className="timetable-events-area">
                      {hours.map(h => <div key={h} className="timetable-grid-line" />)}
                      
                      {dayEvents.map((e, idx) => (
                        <div key={idx} className="timetable-event-card" style={getEventStyle(e)}>
                           <div className="card-top">
                             <span className="card-course">{e.courseCode}</span>
                           </div>
                           <div className="card-body">
                             <div className="card-section">{e.sectionIdentifier}</div>
                             <div className="card-room">📍 {e.roomName}</div>
                             <div className="card-time">{e.startTime} - {e.endTime}</div>
                           </div>
                           <div className="card-footer">
                             {e.syllabusId ? (
                               <button 
                                 className="btn-syllabus-link" 
                                 onClick={() => navigate(`/dashboard/instruction/syllabi/${e.syllabusId}`)}
                                 title="View Syllabus"
                               >
                                 Syllabus ↗
                               </button>
                             ) : (
                               <span className="btn-no-syllabus tooltip">Missing Syllabus</span>
                             )}
                           </div>
                        </div>
                      ))}
                   </div>
                 </div>
               );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
