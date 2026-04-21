import { useState, useEffect } from 'react';
import './EventCreationForm.css';
import { useAuth } from '../../../providers/AuthContext';
// Optionally fetch rooms
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EventCreationForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    isVirtual: false,
    meetingUrl: '',
    roomId: '',
    organizers: [{ userId: user?._id || '', role: 'Lead Organizer' }]
  });

  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch rooms
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/scheduling/rooms`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
      }
    };
    fetchRooms();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addOrganizer = () => {
    setFormData(prev => ({
      ...prev,
      organizers: [...prev.organizers, { userId: '', role: 'Co-Organizer' }]
    }));
  };

  const updateOrganizer = (index, field, value) => {
    const newOrganizers = [...formData.organizers];
    newOrganizers[index][field] = value;
    setFormData(prev => ({ ...prev, organizers: newOrganizers }));
  };

  const removeOrganizer = (index) => {
    if (formData.organizers.length === 1) return;
    const newOrganizers = formData.organizers.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, organizers: newOrganizers }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const payload = { ...formData, schedule: { date: formData.date, startTime: formData.startTime, endTime: formData.endTime } };
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 409) {
          const alertMsg = data.message || 'Venue Double-Booked';
          setError(alertMsg);
          window.alert(`Venue Double-Booked:\n${alertMsg}`);
        } else {
          setError(data.message || 'Failed to create event');
        }
      } else {
        setSuccess(true);
        setFormData({
          type: '', title: '', date: '', startTime: '', endTime: '',
          isVirtual: false, meetingUrl: '', roomId: '',
          organizers: [{ userId: user?._id || '', role: 'Lead Organizer' }]
        });
      }
    } catch (err) {
      setError(err.message || 'Error communicating with the server.');
    }
  };

  return (
    <div className="event-creation-form-container">
      <h2>Create Event</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Event created successfully!</div>}
      
      <form onSubmit={handleSubmit} className="event-form">
        <label>
          Title: *
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        </label>
        
        <label>
          Type: *
          <select name="type" value={formData.type} onChange={handleChange} required>
            <option value="">Select Type</option>
            <option value="Curricular">Curricular</option>
            <option value="Extra-Curricular">Extra-Curricular</option>
          </select>
        </label>
        
        <label>
          Date: *
          <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        </label>

        <div className="time-row">
          <label>
            Start Time: *
            <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
          </label>
          <label>
            End Time: *
            <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
          </label>
        </div>

        <label className="checkbox-label">
          <input type="checkbox" name="isVirtual" checked={formData.isVirtual} onChange={handleChange} />
          Is Virtual Event?
        </label>

        {formData.isVirtual ? (
          <label>
            Meeting URL: *
            <input type="url" name="meetingUrl" value={formData.meetingUrl} onChange={handleChange} required />
          </label>
        ) : (
          <label>
            Venue (Room): *
            <select name="roomId" value={formData.roomId} onChange={handleChange} required>
              <option value="">Select a Room</option>
              {rooms.map(room => (
                <option key={room._id} value={room._id}>{room.name}</option>
              ))}
            </select>
          </label>
        )}

        <div className="organizers-section">
          <h3>Organizers</h3>
          {formData.organizers.map((org, idx) => (
            <div key={idx} className="organizer-row">
              <input 
                type="text" 
                placeholder="User ID" 
                value={org.userId} 
                onChange={(e) => updateOrganizer(idx, 'userId', e.target.value)} 
                required 
              />
              <input 
                type="text" 
                placeholder="Role (e.g. Co-Organizer)" 
                value={org.role} 
                onChange={(e) => updateOrganizer(idx, 'role', e.target.value)} 
                required 
              />
              {formData.organizers.length > 1 && (
                <button type="button" onClick={() => removeOrganizer(idx)} className="btn-remove">X</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addOrganizer} className="btn-add">Add Organizer</button>
        </div>

        <button type="submit" className="btn-submit">Create Event</button>
      </form>
    </div>
  );
}
