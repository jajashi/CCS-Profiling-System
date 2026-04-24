import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './GlobalCalendarPage.css';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../../../lib/api';

const localizer = momentLocalizer(moment);

export default function GlobalCalendarPage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiFetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          // Map to react-big-calendar format. Native Date automatically converts from UTC ISO string to local browser time!
          const formattedEvents = data.map(evt => ({
            id: evt._id,
            title: evt.title,
            start: new Date(evt.schedule.startTime),
            end: new Date(evt.schedule.endTime),
            type: evt.type,
            resource: evt
          }));
          setEvents(formattedEvents);
          setFilteredEvents(formattedEvents);
        } else {
          setError('Failed to fetch events');
        }
      } catch (err) {
        setError('Network Error');
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (filterType === 'All') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(e => e.type === filterType));
    }
  }, [filterType, events]);

  const handleSelectEvent = (event) => {
    navigate('/dashboard/events', { state: { openEventId: event.id } });
  };

  return (
    <div className="global-calendar-container">
      <div className="global-calendar-header">
        <h2>Global Event Calendar</h2>
        
        <div className="filter-controls">
          <label>Filter By Category:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="All">All Events</option>
            <option value="Curricular">Only Curricular</option>
            <option value="Extra-Curricular">Only Extra-Curricular</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          onSelectEvent={handleSelectEvent}
          views={['month', 'week', 'day']}
          defaultView="month"
          eventPropGetter={(event) => {
            const backgroundColor = event.type === 'Curricular' ? '#2563eb' : '#10b981';
            return { style: { backgroundColor } };
          }}
        />
      </div>
    </div>
  );
}
