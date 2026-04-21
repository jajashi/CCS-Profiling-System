import { useState, useEffect } from 'react';
import './EventApprovalQueue.css';
import { useAuth } from '../../../providers/AuthContext';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EventApprovalQueue() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter only pending_approval events
        setEvents(data.filter(e => e.status === 'pending_approval'));
      }
    } catch (err) {
      setError('Error fetching approval queue');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAction = async (id, status, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const payload = { status };
      if (reason) payload.cancelReason = reason;

      const res = await fetch(`${apiUrl}/api/events/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEvents(prev => prev.filter(e => e._id !== id));
        setRejectId(null);
        setRejectReason('');
      } else {
        const data = await res.json();
        alert(data.message || 'Error updating event status');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div className="approval-queue-container">
      <h2>Pending Event Approvals</h2>
      {error && <div className="error-message">{error}</div>}
      
      {events.length === 0 ? (
        <p className="no-events-msg">No pending events requiring approval at this time.</p>
      ) : (
        <div className="queue-list">
          {events.map(event => (
            <div key={event._id} className="queue-card">
              <div className="queue-card-header">
                <h3>{event.title}</h3>
                <span className="badge pending">Pending</span>
              </div>
              <div className="queue-card-body">
                <p><strong>Type:</strong> {event.type}</p>
                <p>
                  <strong>Date:</strong> {new Date(event.schedule.date).toLocaleDateString()}{' '}
                  <strong>Time:</strong> {event.schedule.startTime} - {event.schedule.endTime}
                </p>
                <p><strong>Is Virtual:</strong> {event.isVirtual ? 'Yes' : 'No'}</p>
                {event.isVirtual ? (
                  <p><strong>Link:</strong> {event.meetingUrl}</p>
                ) : (
                  <p><strong>Room:</strong> {event.roomId?.name || 'N/A'}</p>
                )}
              </div>
              
              <div className="queue-card-actions">
                {rejectId === event._id ? (
                  <div className="reject-form">
                    <input 
                      type="text" 
                      placeholder="Reason for rejection (Optional)" 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="btn-group">
                      <button className="btn-confirm" onClick={() => handleAction(event._id, 'rejected', rejectReason)}>Confirm Reject</button>
                      <button className="btn-cancel" onClick={() => setRejectId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button className="btn-approve" onClick={() => handleAction(event._id, 'published')}>Approve</button>
                    <button className="btn-reject" onClick={() => setRejectId(event._id)}>Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
