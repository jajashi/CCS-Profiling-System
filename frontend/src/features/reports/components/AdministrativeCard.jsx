import React from 'react';

const AdministrativeCard = ({ skills, violation }) => {
  const hasSkills = skills && skills.length > 0;
  const hasViolation = violation && violation.trim() !== '';

  if (!hasSkills && !hasViolation) {
    return (
      <div className="card administrative-card">
        <h3>Administrative Records</h3>
        <div className="card-content">
          <p className="no-data">No administrative records available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card administrative-card">
      <h3>Administrative Records</h3>
      <div className="card-content">
        {hasSkills && (
          <div className="admin-section">
            <h4>Skills & Competencies</h4>
            <div className="skills-list">
              {skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {hasViolation && (
          <div className="admin-section violation-section">
            <h4>Disciplinary Records</h4>
            <div className="violation-content">
              <div className="violation-item">
                <span className="violation-text">{violation}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdministrativeCard;
