import React from 'react';
import { FiUser, FiInfo, FiExternalLink, FiX, FiPhone, FiMail, FiMapPin, FiActivity, FiAward } from 'react-icons/fi';
import './StudentSummaryModal.css';

const StudentSummaryModal = ({ student, onClose, onViewFullDossier }) => {
  if (!student) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="summary-modal-header">
          <h3>Student Summary</h3>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>

        <div className="summary-modal-content">
          <div className="summary-profile-header">
            <div className="summary-avatar">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div className="summary-identity">
              <h4>{student.lastName}, {student.firstName}</h4>
              <p className="student-id-sub">{student.id}</p>
              <span className={`status-badge status-${student.status?.toLowerCase()}`}>
                {student.status}
              </span>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label"><FiInfo /> Academic Info</span>
              <p className="summary-value">{student.program} - Year {student.yearLevel}</p>
              <p className="summary-sub">Section: {student.section}</p>
            </div>

            <div className="summary-item">
              <span className="summary-label"><FiMail /> Contact Info</span>
              <p className="summary-value">{student.email}</p>
              <p className="summary-sub">{student.contact}</p>
            </div>

            <div className="summary-item">
              <span className="summary-label"><FiActivity /> Engagement</span>
              <p className="summary-value">{(student.currentTermEvents || []).length} Events Attended</p>
            </div>

            <div className="summary-item">
              <span className="summary-label"><FiAward /> Competencies</span>
              <p className="summary-value">{(student.skills || []).length} Skills Listed</p>
            </div>
          </div>

          {student.violation && student.violation !== 'None' && (
            <div className="summary-violation-warning">
              <FiInfo />
              <span>Student has recorded disciplinary notes.</span>
            </div>
          )}
        </div>

        <div className="summary-modal-footer">
          <div className="summary-footer-actions">
            <button 
              className="btn-primary-summary" 
              onClick={() => {
                onViewFullDossier(student._id);
                onClose();
              }}
            >
              <FiExternalLink /> View Dossier
            </button>
          </div>
          <button className="btn-secondary w-full" onClick={onClose} style={{ width: '100%' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default StudentSummaryModal;
