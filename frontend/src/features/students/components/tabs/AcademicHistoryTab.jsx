import React from 'react';
import { FiAward, FiHome, FiBook, FiStar } from 'react-icons/fi';

const AcademicHistoryTab = ({ student }) => {
  const academicHistory = student.academicHistory || {};
  const elementary = academicHistory.elementary || '';
  const elementaryAchievements = academicHistory.elementaryAchievements || [];
  const highSchool = academicHistory.highSchool || '';
  const highSchoolAchievements = academicHistory.highSchoolAchievements || [];

  return (
    <div className="profile-tab-content">
      {/* Elementary Section */}
      <div className="profile-section">
        <h4 className="section-title">
          <FiHome style={{ marginRight: '8px' }} />
          Elementary School
        </h4>
        <div className="school-info-item">
          <p className="school-value">{elementary || 'Not recorded'}</p>
        </div>
        <h5 className="subsection-title">
          <FiStar style={{ marginRight: '6px' }} />
          Achievements
        </h5>
        <div className="achievements-list">
          {elementaryAchievements.length > 0 ? (
            <ul className="achievements-grid">
              {elementaryAchievements.map((achievement, idx) => (
                <li key={idx} className="achievement-badge">
                  <FiAward className="achievement-icon" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No elementary achievements recorded.</p>
          )}
        </div>
      </div>

      {/* High School Section */}
      <div className="profile-section">
        <h4 className="section-title">
          <FiBook style={{ marginRight: '8px' }} />
          High School
        </h4>
        <div className="school-info-item">
          <p className="school-value">{highSchool || 'Not recorded'}</p>
        </div>
        <h5 className="subsection-title">
          <FiStar style={{ marginRight: '6px' }} />
          Achievements
        </h5>
        <div className="achievements-list">
          {highSchoolAchievements.length > 0 ? (
            <ul className="achievements-grid">
              {highSchoolAchievements.map((achievement, idx) => (
                <li key={idx} className="achievement-badge">
                  <FiAward className="achievement-icon" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No high school achievements recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicHistoryTab;
