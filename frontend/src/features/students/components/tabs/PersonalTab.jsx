import React from 'react';

const PersonalTab = ({ student }) => {
  return (
    <div className="profile-tab-content">
      <div className="profile-section">
        <h4 className="section-title">Personal Information</h4>
        <div className="modal-grid">
          <div>
            <p className="label">Date of Birth</p>
            <input className="readonly-field" type="text" value={student.dob || ''} readOnly />
          </div>
          <div>
            <p className="label">Gender</p>
            <input className="readonly-field" type="text" value={student.gender || ''} readOnly />
          </div>
          <div className="md:col-span-2">
            <p className="label">Home Address</p>
            <input 
              className="readonly-field" 
              type="text" 
              value={student.address?.street ? `${student.address.street}, ${student.address.city}, ${student.address.province}` : 'Not provided'} 
              readOnly 
            />
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h4 className="section-title">Contact & Guardian Details</h4>
        <div className="modal-grid">
          <div>
            <p className="label">Contact Number</p>
            <input className="readonly-field" type="text" value={student.contact || ''} readOnly />
          </div>
          <div>
            <p className="label">Email Address</p>
            <input className="readonly-field" type="text" value={student.email || ''} readOnly />
          </div>
          <div>
            <p className="label">Guardian Name</p>
            <input className="readonly-field" type="text" value={student.guardian || ''} readOnly />
          </div>
          <div>
            <p className="label">Guardian Contact</p>
            <input className="readonly-field" type="text" value={student.guardianContact || ''} readOnly />
          </div>
          <div>
            <p className="label">Emergency Contact Name</p>
            <input className="readonly-field" type="text" value={student.emergencyContact?.name || ''} readOnly />
          </div>
          <div>
            <p className="label">Emergency Contact Phone</p>
            <input className="readonly-field" type="text" value={student.emergencyContact?.phone || ''} readOnly />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalTab;
