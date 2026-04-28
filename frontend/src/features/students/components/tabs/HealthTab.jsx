import React from 'react';

const HealthTab = ({ student }) => {
  return (
    <div className="profile-tab-content">
      <div className="profile-section">
        <h4 className="section-title">Health Information</h4>
        <div className="modal-grid">
          <div className="md:col-span-2">
            <p className="label">Medical Conditions / Allergies</p>
            <div className="readonly-area">
              {student.healthInfo?.conditions && student.healthInfo.conditions.length > 0 ? (
                <ul className="conditions-list">
                  {student.healthInfo.conditions.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              ) : (
                <p className="text-muted">No medical conditions reported.</p>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="label">Special Needs or Considerations</p>
            <textarea 
              className="readonly-field" 
              style={{ minHeight: '100px' }} 
              value={student.healthInfo?.notes || 'None reported'} 
              readOnly 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthTab;
