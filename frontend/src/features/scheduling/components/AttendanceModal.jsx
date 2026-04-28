import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiUserX, FiClock, FiAlertCircle, FiSave, FiDownload } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import toast from 'react-hot-toast';

export default function AttendanceModal({ sectionId, sectionIdentifier, courseTitle, onClose }) {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({}); // studentId -> status

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        // Load roster
        const rosterRes = await apiFetch(`/api/scheduling/sections/${sectionId}/roster`);
        const rosterData = await rosterRes.json();
        setRoster(rosterData);

        // Load existing attendance for today
        const attendRes = await apiFetch(`/api/scheduling/sections/${sectionId}/attendance?date=${sessionDate}`);
        if (attendRes.ok) {
          const attendData = await attendRes.json();
          const mapped = {};
          (attendData.records || []).forEach(r => {
            mapped[r.studentId] = r.status;
          });
          setRecords(mapped);
        } else {
          // Initialize all as Present by default if no record exists
          const initial = {};
          rosterData.forEach(s => {
            initial[s._id] = "Present";
          });
          setRecords(initial);
        }
      } catch (err) {
        toast.error("Failed to load attendance data.");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [sectionId, sessionDate]);

  const updateStatus = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const payload = Object.entries(records).map(([studentId, status]) => ({
        studentId,
        status
      }));

      const res = await apiFetch(`/api/scheduling/sections/${sectionId}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionDate, records: payload }),
      });

      if (!res.ok) throw new Error("Failed to save attendance.");
      toast.success("Attendance saved successfully.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present": return "#10b981";
      case "Absent": return "#ef4444";
      case "Late": return "#f59e0b";
      case "Excused": return "#6366f1";
      default: return "#64748b";
    }
  };

  return (
    <div className="spec-modal-backdrop" onClick={onClose}>
      <div className="spec-modal spec-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="spec-modal-header">
          <div>
            <h2 className="spec-modal-title">Attendance Tracking</h2>
            <p className="spec-modal-sub">{courseTitle} ({sectionIdentifier})</p>
          </div>
          <button onClick={onClose} className="spec-modal-close"><FiX /></button>
        </div>

        <div className="spec-modal-body">
          <div className="attendance-controls" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="date-picker-wrap">
              <label className="form-label">Session Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={sessionDate} 
                onChange={e => setSessionDate(e.target.value)} 
              />
            </div>
            <div className="attendance-stats" style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
              <div className="stat-pill"><span style={{ color: '#10b981' }}>●</span> Present: {Object.values(records).filter(v => v === "Present").length}</div>
              <div className="stat-pill"><span style={{ color: '#ef4444' }}>●</span> Absent: {Object.values(records).filter(v => v === "Absent").length}</div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading roster...</div>
          ) : (
            <div className="attendance-table-wrapper" style={{ maxHeight: '50vh', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table className="attendance-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Student Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map(student => (
                    <tr key={student._id}>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.firstName} {student.lastName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{student.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div className="attendance-options" style={{ display: 'inline-flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', gap: '0.25rem' }}>
                          {["Present", "Absent", "Late", "Excused"].map(status => (
                            <button
                              key={status}
                              onClick={() => updateStatus(student._id, status)}
                              style={{
                                border: 'none',
                                padding: '0.4rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                background: records[student._id] === status ? getStatusColor(status) : 'transparent',
                                color: records[student._id] === status ? 'white' : '#64748b',
                                transition: 'all 0.2s'
                              }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="spec-modal-footer">
          <button className="spec-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="spec-btn-primary" onClick={handleSave} disabled={submitting}>
            <FiSave /> {submitting ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}
