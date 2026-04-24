import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './EventCreationForm.css';
import { useAuth } from '../../../providers/AuthContext';
import { apiFetch } from '../../../lib/api';

const TARGET_ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'admin', label: 'Admin' },
];

const TARGET_PROGRAM_OPTIONS = [
  { value: 'BSCS', label: 'BSCS' },
  { value: 'BSIT', label: 'BSIT' },
];

const TARGET_YEAR_OPTIONS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
];

function toDateInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  const text = String(value);
  return /^\d{2}:\d{2}$/.test(text) ? text : '';
}

export default function EventCreationForm({ mode = 'create', initialData = null, onCreated, onUpdated, hideTitle = false }) {
  const { user } = useAuth();
  const isEditMode = mode === 'edit';
  const [formData, setFormData] = useState({
    type: '',
    typeOtherLabel: '',
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
    attachments: [],
    feedbackEnabled: false
  });

  const [files, setFiles] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isEditMode || !initialData) return;
    setFormData({
      type: initialData.type || '',
      typeOtherLabel: initialData.typeOtherLabel || '',
      title: initialData.title || '',
      date: toDateInputValue(initialData.schedule?.date || initialData.schedule?.startTime),
      startTime: toTimeInputValue(initialData.schedule?.startTime),
      endTime: toTimeInputValue(initialData.schedule?.endTime),
      isVirtual: Boolean(initialData.isVirtual),
      meetingUrl: initialData.meetingUrl || '',
      roomId: initialData.roomId?._id || initialData.roomId || '',
      organizers: Array.isArray(initialData.organizers) && initialData.organizers.length > 0
        ? initialData.organizers.map((org) => ({
            userId: org.userId?._id || org.userId?.username || org.userId || '',
            role: org.role || 'Co-Organizer',
          }))
        : [{ userId: user?._id || '', role: 'Lead Organizer' }],
      targetGroups: {
        roles: initialData.targetGroups?.roles || [],
        programs: initialData.targetGroups?.programs || [],
        yearLevels: initialData.targetGroups?.yearLevels || [],
      },
      attachments: initialData.attachments || [],
      feedbackEnabled: Boolean(initialData.feedbackEnabled),
    });
  }, [isEditMode, initialData, user?._id]);

  useEffect(() => {
    // Fetch rooms
    const fetchRooms = async () => {
      try {
        const res = await apiFetch('/api/scheduling/rooms');
        
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

  const toggleTargetGroup = (fieldName, value) => {
    setFormData((prev) => {
      const currentValues = prev.targetGroups?.[fieldName] || [];
      const exists = currentValues.includes(value);
      return {
        ...prev,
        targetGroups: {
          ...prev.targetGroups,
          [fieldName]: exists
            ? currentValues.filter((item) => item !== value)
            : [...currentValues, value],
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      let uploadedAttachments = [];

      // 1. Upload files first
      if (files.length > 0) {
        const formDataUpload = new FormData();
        files.forEach(f => formDataUpload.append('attachments', f));
        
        const uploadRes = await apiFetch('/api/events/upload', {
          method: 'POST',
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
        attachments: isEditMode
          ? [...(initialData?.attachments || []), ...uploadedAttachments]
          : uploadedAttachments,
        schedule: { date: localStartTime.toISOString(), startTime: localStartTime.toISOString(), endTime: localEndTime.toISOString() } 
      };
      
      const endpoint = isEditMode && initialData?._id ? `/api/events/${initialData._id}` : '/api/events';
      const method = isEditMode ? 'PATCH' : 'POST';
      const res = await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
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
        toast.success(isEditMode ? 'Event updated successfully!' : 'Event created successfully!');
        setSuccess(true);
        if (isEditMode) {
          onUpdated?.(data);
        } else {
          onCreated?.(data);
          setFormData({
            type: '', typeOtherLabel: '', title: '', date: '', startTime: '', endTime: '',
            isVirtual: false, meetingUrl: '', roomId: '',
            organizers: [{ userId: user?._id || '', role: 'Lead Organizer' }],
            targetGroups: { roles: [], programs: [], yearLevels: [] },
            attachments: [],
            feedbackEnabled: false
          });
          setFiles([]);
        }
      }
    } catch (err) {
      setError(err.message || 'Error communicating with the server.');
    } finally {
      setUploading(false);
    }
  };

  const isStudent = user?.role === 'student';
  const buttonText = isEditMode
    ? 'Save Changes'
    : (isStudent ? 'Submit for Approval' : 'Publish Event');

  return (
    <div className={`event-creation-form-container ${isEditMode ? 'event-creation-form--edit' : ''}`}>
      {!hideTitle ? <h2>{isEditMode ? 'Edit Event' : (isStudent ? 'Propose Event' : 'Create Event')}</h2> : null}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{isEditMode ? 'Event updated successfully!' : 'Event created successfully!'}</div>}
      
      <form onSubmit={handleSubmit} className="event-form">
        <section className="event-form-section">
          <h3>Event Information</h3>
          <div className="event-form-grid event-form-grid--two">
            <label className="event-form-span-full">
              Title: *
              <input type="text" name="title" value={formData.title} onChange={handleChange} required />
            </label>

            <div className={`event-type-row ${formData.type === 'Other' ? 'is-other' : ''}`}>
              <label>
                Type: *
                <select name="type" value={formData.type} onChange={handleChange} required>
                  <option value="">Select Type</option>
                  <option value="Curricular">Curricular</option>
                  <option value="Extra-Curricular">Extra-Curricular</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              {formData.type === 'Other' ? (
                <label>
                  Specify Type: *
                  <input
                    type="text"
                    name="typeOtherLabel"
                    value={formData.typeOtherLabel}
                    onChange={handleChange}
                    placeholder="e.g., Community Outreach, Research Colloquium"
                    required
                  />
                </label>
              ) : null}
            </div>
          </div>
        </section>
        
        <section className="event-form-section">
          <h3>Schedule & Venue</h3>
          <div className="event-form-grid event-form-grid--three">
            <label>
              Date: *
              <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </label>
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
            Virtual Event
          </label>

          {formData.isVirtual ? (
            <label>
              Meeting Link: *
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
        </section>

        <section className="event-form-section organizers-section">
          <h3>Audience Targeting</h3>
          <p className="event-form-help">Leave blank to target all users.</p>
          <div className="target-grid">
            <div>
              <label>Target Roles:</label>
              <div className="target-checklist">
                {TARGET_ROLE_OPTIONS.map((option) => {
                  const isChecked = formData.targetGroups.roles.includes(option.value);
                  return (
                    <label key={option.value} className={`target-checkbox ${isChecked ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTargetGroup('roles', option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <label>Target Programs:</label>
              <div className="target-checklist">
                {TARGET_PROGRAM_OPTIONS.map((option) => {
                  const isChecked = formData.targetGroups.programs.includes(option.value);
                  return (
                    <label key={option.value} className={`target-checkbox ${isChecked ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTargetGroup('programs', option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <label>Target Year Levels:</label>
              <div className="target-checklist">
                {TARGET_YEAR_OPTIONS.map((option) => {
                  const isChecked = formData.targetGroups.yearLevels.includes(option.value);
                  return (
                    <label key={option.value} className={`target-checkbox ${isChecked ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTargetGroup('yearLevels', option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="event-form-section organizers-section">
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
        </section>

        <section className="event-form-section organizers-section">
          <h3>Attachments</h3>
          <p className="event-form-help">Max 5MB per file. Only .pdf, .jpg, .png</p>
          <input 
            type="file" 
            multiple 
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="attachments-input"
          />
        </section>

        <section className="event-form-section organizers-section">
          <label className="checkbox-label">
            <input type="checkbox" name="feedbackEnabled" checked={formData.feedbackEnabled} onChange={handleChange} />
            Enable Post-Event Feedback Collection
          </label>
          <p className="event-form-help">
            If enabled, verified attendees will be able to submit feedback after the event ends.
          </p>
        </section>

        <div className="event-form-footer">
          <button type="submit" className="btn-submit" disabled={uploading}>
            {uploading ? 'Uploading & Processing...' : buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}
