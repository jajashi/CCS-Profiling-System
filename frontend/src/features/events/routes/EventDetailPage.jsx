import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/events/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEvent(data);
        } else {
          const data = await res.json();
          setError(data.message || 'Event not found');
        }
      } catch (err) {
        setError('Network Error');
      }
    };
    fetchEvent();
  }, [id]);

  if (error) return <div style={{padding: '2rem', color: 'red'}}>{error}</div>;
  if (!event) return <div style={{padding: '2rem'}}>Loading...</div>;

  return (
    <div style={{maxWidth: '800px', margin: '0 auto', padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', marginTop: '2rem'}}>
      <h2>{event.title}</h2>
      <p><strong>Status:</strong> {event.status}</p>
      <p><strong>Type:</strong> {event.type}</p>
      <p><strong>Date:</strong> {new Date(event.schedule.date).toLocaleDateString()}</p>
      <p><strong>Time:</strong> {event.schedule.startTime} - {event.schedule.endTime}</p>
      
      {event.isVirtual ? (
        <p><strong>Meeting URL:</strong> <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">{event.meetingUrl}</a></p>
      ) : (
        <p><strong>Venue:</strong> {event.roomId?.name || 'N/A'}</p>
      )}

      {event.attachments && event.attachments.length > 0 && (
        <div style={{marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px'}}>
          <h3 style={{marginTop: 0, fontSize: '1.25rem'}}>Attachments</h3>
          <ul style={{listStyle: 'none', padding: 0}}>
            {event.attachments.map((file, idx) => (
              <li key={idx} style={{marginBottom: '0.5rem'}}>
                <a 
                  href={`${apiUrl}${file.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{color: '#2563eb', textDecoration: 'none', fontWeight: '500'}}
                >
                  📄 {file.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
