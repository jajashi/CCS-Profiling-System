import React from 'react';
import { FiMail, FiPhone, FiBook, FiAward, FiEdit2, FiEye, FiPower } from 'react-icons/fi';
import femaleImage from '../../../assets/images/female.jpg';
import maleImage from '../../../assets/images/male.jpg';

const FacultyCard = ({ member, onView, onEdit, onToggleStatus, isAdmin }) => {
  const avatar = member.profileAvatar || ((member.gender || '').toLowerCase() === 'male' ? maleImage : femaleImage);
  const isInactive = member.status === 'Inactive';

  return (
    <div className={`faculty-card ${isInactive ? 'inactive' : ''}`}>
      <div className="faculty-card-header">
        <div className="faculty-avatar-wrap">
          <img src={avatar} alt={member.firstName} className="faculty-avatar" />
          <span className={`status-indicator ${member.status?.toLowerCase()}`} />
        </div>
        <div className="faculty-badge-group">
          <span className="dept-badge">{member.department}</span>
          <span className="type-badge">{member.employmentType}</span>
        </div>
      </div>

      <div className="faculty-card-body">
        <h4 className="faculty-name">
          {member.firstName} {member.lastName}
        </h4>
        <p className="faculty-position">{member.position || 'Faculty Member'}</p>
        <p className="faculty-id">ID: {member.employeeId}</p>

        <div className="faculty-contact-info">
          <div className="contact-item">
            <FiMail />
            <span>{member.institutionalEmail || member.personalEmail || 'No email'}</span>
          </div>
          {member.mobileNumber && (
            <div className="contact-item">
              <FiPhone />
              <span>{member.mobileNumber}</span>
            </div>
          )}
        </div>

        <div className="faculty-specs">
          <FiAward />
          <div className="specs-list">
            {member.specializations?.length > 0 ? (
              member.specializations.slice(0, 2).map((s, idx) => (
                <span key={idx} className="spec-tag">
                  {typeof s === 'object' ? s.name : s}
                </span>
              ))
            ) : (
              <span className="no-specs">No specializations</span>
            )}
            {member.specializations?.length > 2 && (
              <span className="more-specs">+{member.specializations.length - 2} more</span>
            )}
          </div>
        </div>
      </div>

      <div className="faculty-card-footer">
        <button className="card-action-btn view" onClick={() => onView(member)} title="View Profile">
          <FiEye />
        </button>
        {isAdmin && (
          <>
            <button className="card-action-btn edit" onClick={() => onEdit(member)} title="Edit Faculty">
              <FiEdit2 />
            </button>
            <button 
              className={`card-action-btn toggle ${isInactive ? 'activate' : 'deactivate'}`} 
              onClick={() => onToggleStatus(member)} 
              title={isInactive ? 'Activate' : 'Deactivate'}
            >
              <FiPower />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FacultyCard;
