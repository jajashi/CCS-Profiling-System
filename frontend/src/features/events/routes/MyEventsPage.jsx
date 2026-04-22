import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { FiCalendar, FiDownload, FiClock, FiMapPin, FiAward, FiXCircle } from 'react-icons/fi';
import './MyEventsPage.css';

export default function MyEventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingCert, setDownloadingCert] = useState(null);

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/events/user/${user.id}/events`);
        
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        } else {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.message || 'Failed to fetch events');
        }
      } catch (err) {
        setError(err.message || 'Error fetching events');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchMyEvents();
    }
  }, [user?.id]);

  const handleDownloadCertificate = async (eventId) => {
    try {
      setDownloadingCert(eventId);
      const res = await apiFetch(`/api/events/${eventId}/certificates/me`);
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event_${eventId}_certificate.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to download certificate');
      }
    } catch (err) {
      alert(err.message || 'Error downloading certificate');
    } finally {
      setDownloadingCert(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="my-events-container">
        <div className="loading">Loading your events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-events-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="my-events-container">
      <div className="page-header">
        <h1>My Events</h1>
        <p>Events you have attended and your participation certificates</p>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <FiCalendar className="empty-icon" />
          <h3>No events attended yet</h3>
          <p>When you attend events, they will appear here.</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.eventId} className="event-card">
              <div className="event-card-header">
                <span className="event-type">{event.type}</span>
                <span className={`event-status status-${event.status}`}>
                  {event.status === 'completed' ? 'Completed' : event.status}
                </span>
              </div>

              <h3 className="event-title">{event.title}</h3>

              <div className="event-details">
                <div className="event-detail">
                  <FiCalendar className="detail-icon" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="event-detail">
                  <FiClock className="detail-icon" />
                  <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                </div>
                <div className="event-detail">
                  <FiMapPin className="detail-icon" />
                  <span>{event.location}</span>
                </div>
                <div className="event-detail">
                  <FiAward className="detail-icon" />
                  <span>Organized by {event.organizer}</span>
                </div>
              </div>

              <div className="event-card-footer">
                {event.certificateAvailable ? (
                  <button
                    className="download-cert-btn"
                    onClick={() => handleDownloadCertificate(event.eventId)}
                    disabled={downloadingCert === event.eventId}
                  >
                    {downloadingCert === event.eventId ? (
                      <>Downloading...</>
                    ) : (
                      <>
                        <FiDownload />
                        <span>Download Certificate</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button className="cert-not-available-btn" disabled>
                    <FiXCircle />
                    <span>Certificate Not Yet Available</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
