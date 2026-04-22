import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { FiCheck, FiX, FiUsers, FiClock, FiRefreshCw } from 'react-icons/fi';
import './AttendanceTrackerPage.css';

export default function AttendanceTrackerPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [presentCount, setPresentCount] = useState(0);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/events/${id}`);
        
        if (res.ok) {
          const data = await res.json();
          setEvent(data);
          setAttendees(data.attendees || []);
          setPresentCount(data.attendees?.filter(a => a.attended).length || 0);
        } else {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.message || 'Failed to fetch event');
        }
      } catch (err) {
        setError(err.message || 'Error fetching event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleAttendanceToggle = async (userId, attended) => {
    setUpdating(prev => ({ ...prev, [userId]: true }));
    
    try {
      const res = await apiFetch(`/api/events/${id}/attendees/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ attended })
      });
      
      if (res.ok) {
        // Update local state
        setAttendees(prev => 
          prev.map(attendee => 
            attendee.userId === userId ? { ...attendee, attended } : attendee
          )
        );
        setPresentCount(prev => 
          attended ? prev + 1 : prev - 1
        );
        
        // Clear updating state after delay
        setTimeout(() => {
          setUpdating({});
        }, 500);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to update attendance');
      }
    } catch (err) {
      setError(err.message || 'Error updating attendance');
    } finally {
      setTimeout(() => {
        setUpdating({});
      }, 500);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isEventStarted = () => {
    return event?.schedule?.startTime && new Date(event.schedule.startTime) <= new Date();
  };

  const isOrganizer = () => {
    return event?.organizers?.some(org => String(org.userId) === String(user?.id));
  };

  if (loading) {
    return (
      <div className="attendance-tracker-container">
        <div className="loading">Loading event details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-tracker-container">
        <div className="spec-alert">{error}</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="attendance-tracker-container">
        <div className="spec-alert">Event not found.</div>
      </div>
    );
  }

  if (!isOrganizer()) {
    return (
      <div className="attendance-tracker-container">
        <div className="spec-alert">Access denied. Only organizers can track attendance.</div>
      </div>
    );
  }

  return (
    <div className="attendance-tracker-container">
      {/* Header */}
      <div className="attendance-header">
        <button className="back-btn" onClick={() => navigate(`/dashboard/events/${id}`)}>
          ← Back to Event
        </button>
        <h1>Attendance Tracker</h1>
        <div className="event-info">
          <span className="event-title">{event.title}</span>
          <span className="event-date-time">
            {formatDate(event.schedule?.date)} at {formatTime(event.schedule?.startTime)}
          </span>
        </div>
        <button className="refresh-btn" onClick={() => window.location.reload()}>
          <FiRefreshCw />
          <span>Refresh</span>
        </button>
      </div>

      {/* Attendance Stats */}
      <div className="attendance-stats">
        <div className="stat-card">
          <div className="stat-number">{attendees.length}</div>
          <div className="stat-label">Total RSVP'd</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{presentCount}</div>
          <div className="stat-label">Present</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{attendees.length - presentCount}</div>
          <div className="stat-label">Absent</div>
        </div>
      </div>

      {/* Attendees List */}
      <div className="attendees-list">
        <h3>Attendees ({attendees.length})</h3>
        {isEventStarted() && (
          <div className="event-status-warning">
            <FiClock />
            <span>Event has started. Attendance tracking is now active.</span>
          </div>
        )}
        
        <div className="attendees-grid">
          {attendees.map((attendee) => (
            <div key={attendee.userId} className="attendee-card">
              <div className="attendee-info">
                <div className="attendee-name">
                  {attendee.userId?.name || attendee.userId?.username || 'Unknown User'}
                </div>
                <div className="attendee-status">
                  <span className={`status-indicator ${attendee.attended ? 'present' : 'absent'}`}>
                    {attendee.attended ? '✓' : '○'}
                  </span>
                  <span className="status-text">
                    {attendee.attended ? 'Present' : 'Absent'}
                  </span>
                </div>
              </div>
              
              <div className="attendance-actions">
                <button
                  className={`attendance-btn ${attendee.attended ? 'btn-present' : 'btn-absent'}`}
                  onClick={() => handleAttendanceToggle(attendee.userId, !attendee.attended)}
                  disabled={updating[attendee.userId]}
                  title={attendee.attended ? 'Mark as Absent' : 'Mark as Present'}
                >
                  {attendee.attended ? <FiX /> : <FiCheck />}
                  <span>{attendee.attended ? 'Mark Absent' : 'Mark Present'}</span>
                </button>
                
                {updating[attendee.userId] && (
                  <div className="updating-indicator">
                    Updating...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
