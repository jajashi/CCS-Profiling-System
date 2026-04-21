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
    organizers: [{ userId: user?._id || '', role: 'Lead Organizer' }],
    targetGroups: {
      roles: [],
      programs: [],
      yearLevels: []
    },
    attachments: []
  });

  const [files, setFiles] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleChange = (e) => {
    const { name, value, type, checked, options } = e.target;
    
    if (type === 'select-multiple') {
      const values = Array.from(options).filter(opt => opt.selected).map(opt => opt.value);
      if (name.startsWith('targetGroups.')) {
        const fieldName = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          targetGroups: { ...prev.targetGroups, [fieldName]: values }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: values }));
      }
      return;
    }

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
    setUploading(true);

    try {
      let uploadedAttachments = [];
      const token = localStorage.getItem('token');

      // 1. Upload files first
      if (files.length > 0) {
        const formDataUpload = new FormData();
        files.forEach(f => formDataUpload.append('attachments', f));
        
        const uploadRes = await fetch(`${apiUrl}/api/events/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataUpload
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.message || 'File upload failed');
        }
        uploadedAttachments = uploadData.files;
      }

      // 2. Submit event data
      const localStartTime = new Date(`${formData.date}T${formData.startTime}:00`);
      const localEndTime = new Date(`${formData.date}T${formData.endTime}:00`);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const payload = { 
        ...formData, 
        timezone,
        attachments: uploadedAttachments,
        schedule: { date: localStartTime.toISOString(), startTime: localStartTime.toISOString(), endTime: localEndTime.toISOString() } 
      };
      
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
          organizers: [{ userId: user?._id || '', role: 'Lead Organizer' }],
          targetGroups: { roles: [], programs: [], yearLevels: [] },
          attachments: []
        });
        setFiles([]);
      }
    } catch (err) {
      setError(err.message || 'Error communicating with the server.');
    } finally {
      setUploading(false);
    }
  };

  const isStudent = user?.role === 'student';
  const buttonText = isStudent ? 'Submit for Approval' : 'Publish Event';

  return (
    <div className="event-creation-form-container">
      <h2>{isStudent ? 'Propose Event' : 'Create Event'}</h2>
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
          <h3>Audience Targeting</h3>
          <p style={{fontSize: '0.85rem', color: '#6b7280', margin: '-0.5rem 0 1rem 0'}}>Leave blank to target all users.</p>
          <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <label style={{flex: 1}}>
              Target Roles:
              <select multiple name="targetGroups.roles" value={formData.targetGroups.roles} onChange={handleChange} style={{height: '80px'}}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label style={{flex: 1}}>
              Target Programs:
              <select multiple name="targetGroups.programs" value={formData.targetGroups.programs} onChange={handleChange} style={{height: '80px'}}>
                <option value="BSCS">BSCS</option>
                <option value="BSIT">BSIT</option>
                <option value="BSIS">BSIS</option>
                <option value="BSAM">BSAM</option>
              </select>
            </label>
            <label style={{flex: 1}}>
              Target Year Levels:
              <select multiple name="targetGroups.yearLevels" value={formData.targetGroups.yearLevels} onChange={handleChange} style={{height: '80px'}}>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </label>
          </div>
        </div>

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

        <div className="organizers-section">
          <h3>Attachments</h3>
          <p style={{fontSize: '0.85rem', color: '#6b7280', margin: '-0.5rem 0 1rem 0'}}>Max 5MB per file. Only .pdf, .jpg, .png</p>
          <input 
            type="file" 
            multiple 
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            style={{padding: '0.5rem', border: '1px dashed #d1d5db', width: '100%'}}
          />
        </div>

        <button type="submit" className="btn-submit" disabled={uploading}>
          {uploading ? 'Uploading & Processing...' : buttonText}
        </button>
      </form>
    </div>
  );
}
