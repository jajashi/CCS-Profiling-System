import React from 'react';

const EventsCard = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="card events-card">
        <h3>Current Term Engagement</h3>
        <div className="card-content">
          <p className="no-data">No events attended during current term.</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="card events-card">
      <h3>Current Term Engagement</h3>
      <div className="card-content">
        <div className="events-list">
          {events.map((event, index) => (
            <div key={index} className="event-item">
              <div className="event-header">
                <h4>{event.title}</h4>
                <span className={`event-type type-${event.type.toLowerCase()}`}>
                  {event.type}
                </span>
              </div>
              
              <div className="event-details">
                <div className="detail-item">
                  <label>Date:</label>
                  <span>{formatDate(event.schedule.date)}</span>
                </div>
                
                <div className="detail-item">
                  <label>Time:</label>
                  <span>
                    {formatTime(event.schedule.startTime)} - {formatTime(event.schedule.endTime)}
                  </span>
                </div>
                
                <div className="detail-item">
                  <label>Location:</label>
                  <span>
                    {event.isVirtual ? event.meetingUrl : event.roomId ? 'Physical Location' : 'TBD'}
                  </span>
                </div>
                
                <div className="detail-item">
                  <label>Status:</label>
                  <span className="attended-badge">Attended</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="events-summary">
          <p>
            <strong>Total Events Attended:</strong> {events.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventsCard;
