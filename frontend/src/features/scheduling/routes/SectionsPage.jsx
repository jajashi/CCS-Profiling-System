import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiPlus, FiCalendar, FiBook, FiUser, FiMapPin, FiGrid, FiSettings, FiX, FiTrash2, FiClock, FiSearch } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import toast from 'react-hot-toast';
import './SectionsPage.css';

// --- Modals ---

function CreateSectionModal({ onClose, onCreated, curricula }) {
  const [form, setForm] = useState({
    curriculumId: '',
    term: '1st Term',
    academicYear: '2025-2026'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.curriculumId) return toast.error('Please select a curriculum.');
    
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/scheduling/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create section');
      
      toast.success('Section initialized successfully.');
      onCreated(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spec-modal-backdrop" onClick={onClose}>
      <div className="spec-modal" onClick={e => e.stopPropagation()}>
        <div className="spec-modal-header">
          <div>
            <h2 className="spec-modal-title">Initialize New Section</h2>
            <p className="spec-modal-sub">Step 1: Define the base section linked to a curriculum course.</p>
          </div>
          <button onClick={onClose} className="spec-modal-close"><FiX /></button>
        </div>
        <form onSubmit={handleSubmit} className="spec-modal-body">
          <div className="form-field">
            <label className="form-label">Course / Curriculum</label>
            <select 
              className="form-select"
              value={form.curriculumId}
              onChange={e => setForm({...form, curriculumId: e.target.value})}
              required
            >
              <option value="">Select a course...</option>
              {curricula.map(c => (
                <option key={c._id} value={c._id}>
                  {c.courseCode} - {c.courseTitle}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-grid">
            <div className="form-field">
               <label className="form-label">Academic Year</label>
               <input 
                 className="form-input"
                 value={form.academicYear}
                 onChange={e => setForm({...form, academicYear: e.target.value})}
                 placeholder="e.g. 2025-2026"
                 required
               />
            </div>
            <div className="form-field">
               <label className="form-label">Term</label>
               <select 
                 className="form-select"
                 value={form.term}
                 onChange={e => setForm({...form, term: e.target.value})}
               >
                 <option value="1st Term">1st Term</option>
                 <option value="2nd Term">2nd Term</option>
                 <option value="Summer">Summer</option>
               </select>
            </div>
          </div>
          <div className="spec-modal-footer">
            <button type="button" className="spec-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="spec-btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Initialize Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignResourcesModal({ section, onClose, onUpdated, rooms, faculty, timeBlocks }) {
  const [schedules, setSchedules] = useState(section.schedules || []);
  const [submitting, setSubmitting] = useState(false);

  const addSchedule = () => {
    setSchedules([...schedules, {
      roomId: '',
      facultyId: '',
      dayOfWeek: 'Mon',
      startTime: '09:00',
      endTime: '10:30'
    }]);
  };

  const removeSchedule = (index) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index, field, value) => {
    const next = [...schedules];
    next[index] = { ...next[index], [field]: value };
    
    // If selecting a time block, auto-fill times
    if (field === 'timeBlockId' && value) {
      const tb = timeBlocks.find(t => t._id === value);
      if (tb) {
         next[index].startTime = tb.startTime;
         next[index].endTime = tb.endTime;
         if (tb.daysOfWeek && tb.daysOfWeek.length > 0) {
            next[index].dayOfWeek = tb.daysOfWeek[0];
         }
      }
    }
    
    setSchedules(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/scheduling/sections/${section._id}/resources`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Conflict detected');
      
      toast.success('Resources assigned and validated.');
      onUpdated(data);
    } catch (err) {
      toast.error(err.message, { duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spec-modal-backdrop" onClick={onClose}>
      <div className="spec-modal spec-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="spec-modal-header">
          <div>
            <h2 className="spec-modal-title">Resource Assignment: {section.sectionIdentifier}</h2>
            <p className="spec-modal-sub">Assign faculty, rooms, and time slots. Conflict prevention is active.</p>
          </div>
          <button onClick={onClose} className="spec-modal-close"><FiX /></button>
        </div>
        <form onSubmit={handleSubmit} className="spec-modal-body">
          {schedules.length === 0 && (
            <div className="spec-empty-state" style={{ padding: '2rem' }}>
              <p>No schedules assigned yet.</p>
            </div>
          )}

          {schedules.map((sched, index) => (
            <div key={index} className="resource-form-row">
              <div className="form-field">
                <label className="form-label">Room</label>
                <select 
                  className="form-select"
                  value={sched.roomId?._id || sched.roomId}
                  onChange={e => updateSchedule(index, 'roomId', e.target.value)}
                  required
                >
                  <option value="">Select Room...</option>
                  {rooms.map(r => (
                    <option key={r._id} value={r._id}>{r.name} ({r.roomCode})</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Faculty</label>
                <select 
                  className="form-select"
                  value={sched.facultyId?._id || sched.facultyId}
                  onChange={e => updateSchedule(index, 'facultyId', e.target.value)}
                  required
                >
                  <option value="">Select Instructor...</option>
                  {faculty.map(f => (
                    <option key={f._id} value={f._id}>{f.firstName} {f.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Day & Time</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    className="form-select"
                    value={sched.dayOfWeek}
                    onChange={e => updateSchedule(index, 'dayOfWeek', e.target.value)}
                  >
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={sched.startTime}
                    onChange={e => updateSchedule(index, 'startTime', e.target.value)}
                  />
                  <input 
                    type="time" 
                    className="form-input" 
                    value={sched.endTime}
                    onChange={e => updateSchedule(index, 'endTime', e.target.value)}
                  />
                </div>
              </div>
              <button 
                type="button" 
                className="btn-remove-sched"
                onClick={() => removeSchedule(index)}
              >
                <FiTrash2 />
              </button>
            </div>
          ))}

          <button type="button" className="add-sched-btn" onClick={addSchedule}>
            <FiPlus /> Add Schedule Block
          </button>

          <div className="spec-modal-footer">
            <button type="button" className="spec-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="spec-btn-primary" disabled={submitting}>
              {submitting ? 'Validating...' : 'Save & Block Schedules'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function SectionsPage() {
  const [sections, setSections] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [secRes, curRes, roomRes, facRes, tbRes] = await Promise.all([
        apiFetch('/api/scheduling/sections?status=All'),
        apiFetch('/api/curricula?status=Active'),
        apiFetch('/api/scheduling/rooms?status=Active'),
        apiFetch('/api/faculty'),
        apiFetch('/api/scheduling/timeblocks')
      ]);

      setSections(await secRes.json());
      setCurricula(await curRes.json());
      setRooms(await roomRes.json());
      setFaculty(await facRes.json());
      setTimeBlocks(await tbRes.json());
    } catch (err) {
      toast.error('Failed to load scheduling data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSections = useMemo(() => {
    if (!searchTerm) return sections;
    const q = searchTerm.toLowerCase();
    return sections.filter(s => 
      s.sectionIdentifier.toLowerCase().includes(q) ||
      s.curriculumId?.courseTitle?.toLowerCase().includes(q) ||
      s.curriculumId?.courseCode?.toLowerCase().includes(q)
    );
  }, [sections, searchTerm]);

  return (
    <div className="sections-page spec-page">
      <div className="directory-hero">
        <div className="directory-hero-icon"><FiGrid /></div>
        <div>
          <h1 className="directory-hero-title">Section Management</h1>
          <p className="directory-hero-subtitle">Initialize class sections and assign logistical resources (Rooms, Faculty, Times).</p>
        </div>
      </div>

      <div className="spec-toolbar">
         <div className="search-box">
            <FiSearch />
            <input 
              placeholder="Search sections, courses..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <button className="spec-btn-primary" onClick={() => setShowCreate(true)}>
            <FiPlus /> New Section
         </button>
      </div>

      {loading ? (
        <div className="spec-loading">Loading sections architecture...</div>
      ) : (
        <div className="section-grid">
          {filteredSections.map(section => (
            <div key={section._id} className="section-card">
              <div className="section-header">
                <span className="section-id">{section.sectionIdentifier}</span>
                <span className={`section-status status-${section.status.toLowerCase()}`}>
                  {section.status}
                </span>
              </div>
              
              <h3 className="section-course-title">{section.curriculumId?.courseTitle}</h3>
              <div className="section-course-code">
                <FiBook size={14} /> {section.curriculumId?.courseCode}
              </div>

              <div className="section-meta-row">
                <div className="meta-item">
                  <FiCalendar size={14} /> {section.term}
                </div>
                <div className="meta-item">
                  <FiGrid size={14} /> {section.academicYear}
                </div>
              </div>

              <div className="section-schedules">
                <p className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.5rem' }}>ACTIVE SCHEDULES</p>
                <ul className="schedule-list">
                  {section.schedules && section.schedules.length > 0 ? (
                    section.schedules.map((s, i) => (
                      <li key={i} className="schedule-item">
                        <span className="schedule-time">{s.dayOfWeek} {s.startTime}-{s.endTime}</span>
                        <div className="schedule-resource">
                          <FiMapPin size={12} /> {s.roomId?.name || 'Unknown Room'}
                        </div>
                        <div className="schedule-resource">
                          <FiUser size={12} /> {s.facultyId ? `${s.facultyId.firstName} ${s.facultyId.lastName}` : 'Unassigned'}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="spec-empty-inline">No resources assigned yet.</li>
                  )}
                </ul>
              </div>

              <div className="section-actions">
                <button className="btn-assign" onClick={() => setAssignTarget(section)}>
                  <FiSettings /> Assign Resources
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateSectionModal 
          curricula={curricula}
          onClose={() => setShowCreate(false)}
          onCreated={(newSec) => {
             setSections([newSec, ...sections]);
             setShowCreate(false);
             setAssignTarget(newSec); // Open resource assignment immediately
          }}
        />
      )}

      {assignTarget && (
        <AssignResourcesModal 
          section={assignTarget}
          rooms={rooms}
          faculty={faculty}
          timeBlocks={timeBlocks}
          onClose={() => setAssignTarget(null)}
          onUpdated={(updated) => {
            setSections(sections.map(s => s._id === updated._id ? updated : s));
            setAssignTarget(null);
          }}
        />
      )}
    </div>
  );
}
