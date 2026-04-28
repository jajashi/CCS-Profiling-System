import React from 'react';
import { FiAward, FiAlertTriangle } from 'react-icons/fi';

const HistoryTab = ({ student }) => {
  return (
    <div className="profile-tab-content">
      <div className="profile-section">
        <h4 className="section-title">Skills & Competencies</h4>
        <div className="skills-container-full">
          {student.skills && student.skills.length > 0 ? (
            <div className="skills-grid">
              {student.skills.map((skill, idx) => (
                <span key={idx} className="skill-badge">
                  <FiAward />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="skills-empty">No skills listed in profile.</p>
          )}
        </div>
      </div>

      <div className="profile-section">
        <h4 className="section-title">Disciplinary Record</h4>
        <div className="violation-box">
          {student.violation && student.violation !== 'None' ? (
            <div className="violation-alert">
              <FiAlertTriangle className="violation-icon" />
              <div>
                <p className="violation-text">{student.violation}</p>
                <span className="violation-date">Recorded in student history</span>
              </div>
            </div>
          ) : (
            <p className="text-muted">No disciplinary violations on record.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryTab;
