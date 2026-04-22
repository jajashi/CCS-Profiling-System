import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { FiCalendar, FiMapPin, FiUsers, FiExternalLink, FiCheck, FiX, FiClock, FiUser, FiEdit2, FiEye } from 'react-icons/fi';
import './EventDetailPage.css';

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [error, setError] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/events/${id}`);
        
        if (res.ok) {
          const data = await res.json();
          setEvent(data);
          
          // Check if user is already registered or waitlisted
          const attendee = data.attendees?.find(a => String(a.userId) === String(user?.id));
          const waitlisted = data.waitlist?.find(w => String(w.userId) === String(user?.id));
          
          if (attendee) {
            setRsvpStatus('registered');
          } else if (waitlisted) {
            setRsvpStatus('waitlisted');
          } else {
            setRsvpStatus('available');
          }
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
  }, [id, user?.id]);

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

  const isRegistrationOpen = () => {
    return event && !event.rsvpClosed && !isEventStarted();
  };

  const handleRSVP = async () => {
    if (!isRegistrationOpen()) return;
    
    try {
      const res = await apiFetch(`/api/events/${id}/rsvp`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const data = await res.json();
        setRsvpStatus(data.isWaitlisted ? 'waitlisted' : 'registered');
        // Refresh event data to get updated attendee count
        const eventRes = await apiFetch(`/api/events/${id}`);
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEvent(eventData);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to RSVP');
      }
    } catch (err) {
      setError(err.message || 'Error submitting RSVP');
    }
  };

  const handleCancelRSVP = async () => {
    if (!rsvpStatus || (rsvpStatus !== 'registered' && rsvpStatus !== 'waitlisted')) return;
    
    try {
      const res = await apiFetch(`/api/events/${id}/rsvp`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setRsvpStatus('available');
        setError(null);
        setShowCancelConfirm(false);
        // Refresh event data
        const eventRes = await apiFetch(`/api/events/${id}`);
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEvent(eventData);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to cancel RSVP');
      }
    } catch (err) {
      setError(err.message || 'Error cancelling RSVP');
    }
  };

  const getRSVPButton = () => {
    if (rsvpStatus === 'registered') {
      return (
        <button className="rsvp-btn rsvp-btn-cancel" onClick={() => setShowCancelConfirm(true)}>
          <FiX />
          <span>Cancel Registration</span>
        </button>
      );
    } else if (rsvpStatus === 'waitlisted') {
      return (
        <button className="rsvp-btn rsvp-btn-waitlisted" disabled>
          <FiClock />
          <span>You are #{event.waitlist?.findIndex(w => String(w.userId) === String(user?.id)) + 1} on waitlist</span>
        </button>
      );
    } else if (!isRegistrationOpen()) {
      return (
        <button className="rsvp-btn rsvp-btn-closed" disabled>
          <FiCalendar />
          <span>Registration Closed</span>
        </button>
      );
    } else {
      return (
        <button className="rsvp-btn rsvp-btn-register" onClick={handleRSVP}>
          <FiCalendar />
          <span>{event.isVirtual ? 'Join Virtual Event' : 'Register for Event'}</span>
        </button>
      );
    }
  };

  if (loading) {
    return (
      <div className="event-detail-container">
        <div className="loading">Loading event details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-detail-container">
        <div className="spec-alert">{error}</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-container">
        <div className="spec-alert">Event not found.</div>
      </div>
    );
  }

  const attendeeCount = event.attendees?.length || 0;
  const waitlistCount = event.waitlist?.length || 0;
  const totalRegistered = attendeeCount + waitlistCount;

  return (
    <div className="event-detail-container">
      {/* Header */}
      <div className="event-detail-header">
        <button className="back-btn" onClick={() => navigate('/dashboard/events')}>
          ← Back to Events
        </button>
        <h1>{event.title}</h1>
        <div className="event-meta">
          <span className={`event-status status-${event.status}`}>
            {event.status === 'published' ? 'Published' : 
             event.status === 'pending_approval' ? 'Pending Approval' : 'Draft'}
          </span>
          <span className="event-type">{event.type}</span>
        </div>
      </div>

      {/* Event Details */}
      <div className="event-detail-content">
        <div className="event-detail-grid">
          <div className="detail-card">
            <h3>Event Information</h3>
            <div className="detail-row">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{event.type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{formatDate(event.schedule?.date)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Time:</span>
              <span className="detail-value">
                {formatTime(event.schedule?.startTime)} - {formatTime(event.schedule?.endTime)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Venue:</span>
              <span className="detail-value">
                {event.isVirtual ? (
                  <div className="virtual-event">
                    <FiExternalLink />
                    <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                      {event.meetingUrl}
                    </a>
                  </div>
                ) : (
                  <div className="room-info">
                    <FiMapPin />
                    <span>{event.roomId?.name || 'No venue assigned'}</span>
                  </div>
                )}
              </span>
            </div>
            {event.targetGroups && (
              <div className="detail-row">
                <span className="detail-label">Target Audience:</span>
                <span className="detail-value">
                  {event.targetGroups.roles?.join(', ') || 'All'} • 
                  {event.targetGroups.programs?.join(', ') || 'All Programs'} • 
                  {event.targetGroups.yearLevels?.join(', ') || 'All Years'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Organizers */}
        <div className="detail-card">
          <h3>Organizers</h3>
          <div className="organizers-list">
            {event.organizers?.map((org, idx) => (
              <div key={idx} className="organizer-item">
                <FiUser />
                <div>
                  <span className="organizer-name">{org.userId?.name || org.userId?.username || 'Unknown'}</span>
                  <span className="organizer-role">{org.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Status */}
        <div className="detail-card">
          <h3>Registration</h3>
          <div className="registration-info">
            <div className="registration-stats">
              <div className="stat-item">
                <span className="stat-number">{attendeeCount}</span>
                <span className="stat-label">Registered</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{waitlistCount}</span>
                <span className="stat-label">Waitlisted</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{totalRegistered}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>
            
            {rsvpStatus && (
              <div className="rsvp-status">
                <span className={`status-badge status-${rsvpStatus}`}>
                  {rsvpStatus === 'registered' ? '✓ Registered' : 
                   rsvpStatus === 'waitlisted' ? '⏳ Waitlisted' : 'Available'}
                </span>
                {rsvpStatus === 'waitlisted' && (
                  <span className="waitlist-position">
                    You are #{event.waitlist?.findIndex(w => String(w.userId) === String(user?.id)) + 1} on the waitlist
                  </span>
                )}
              </div>
            )}
            
            <div className="rsvp-actions">
              {getRSVPButton()}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Cancel Registration</h3>
              <button className="modal-close" onClick={() => setShowCancelConfirm(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel your registration for <strong>{event.title}</strong>?</p>
              <p>This will release your spot for other interested participants.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCancelConfirm(false)}>
                No, Keep Registration
              </button>
              <button className="btn btn-danger" onClick={handleCancelRSVP}>
                Yes, Cancel Registration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
