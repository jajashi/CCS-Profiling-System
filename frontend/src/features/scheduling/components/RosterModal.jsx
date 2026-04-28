import React, { useState, useEffect } from 'react';
import { FiX, FiMail, FiPhone, FiUser } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import toast from 'react-hot-toast';

export default function RosterModal({ sectionId, sectionIdentifier, onClose }) {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoster() {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/scheduling/sections/${sectionId}/roster`);
        const data = await res.json();
        setRoster(data);
      } catch (err) {
        toast.error("Failed to load roster.");
      } finally {
        setLoading(false);
      }
    }
    loadRoster();
  }, [sectionId]);

  return (
    <div className="spec-modal-backdrop" onClick={onClose}>
      <div className="spec-modal spec-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="spec-modal-header">
          <div>
            <h2 className="spec-modal-title">Class Roster</h2>
            <p className="spec-modal-sub">Students enrolled in {sectionIdentifier}</p>
          </div>
          <button onClick={onClose} className="spec-modal-close"><FiX /></button>
        </div>

        <div className="spec-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading students...</div>
          ) : (
            <div className="roster-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', padding: '0.5rem' }}>
              {roster.map(student => (
                <div key={student._id} className="student-roster-card" style={{ padding: '1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="student-avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {student.profileAvatar ? (
                      <img src={student.profileAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <FiUser size={30} color="#94a3b8" />
                    )}
                  </div>
                  <div className="student-details">
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{student.lastName}, {student.firstName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.4rem' }}>ID: {student.id}</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {student.email && <a href={`mailto:${student.email}`} title={student.email} style={{ color: '#6366f1' }}><FiMail size={14} /></a>}
                      {student.contact && <a href={`tel:${student.contact}`} title={student.contact} style={{ color: '#10b981' }}><FiPhone size={14} /></a>}
                    </div>
                  </div>
                </div>
              ))}
              
              {roster.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  No students enrolled in this section.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="spec-modal-footer">
          <button className="spec-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
