import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConflictAlertModal.css';

export default function ConflictAlertModal() {
  const [conflictData, setConflictData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleConflict = (e) => {
      setConflictData(e.detail);
    };
    window.addEventListener('api_conflict', handleConflict);
    return () => window.removeEventListener('api_conflict', handleConflict);
  }, []);

  if (!conflictData) return null;

  const { message, conflictType, sectionIdentifier } = conflictData;

  let friendlyMessage = message || "A scheduling conflict occurred.";
  if (conflictType === 'ROOM_DOUBLE_BOOKED') {
    friendlyMessage = `Cannot assign to this room; it is already booked for section ${sectionIdentifier} during this time.`;
  } else if (conflictType === 'FACULTY_DOUBLE_BOOKED') {
    friendlyMessage = `Cannot assign faculty; they are already scheduled to teach section ${sectionIdentifier} during this time.`;
  } else if (conflictType === 'INTERNAL_SCHEDULE_CONFLICT') {
    friendlyMessage = `Multiple schedules inside this very payload contain overlapping times on the same day.`;
  }

  const handleClose = () => {
    setConflictData(null);
  };

  const handleViewConflict = () => {
    setConflictData(null);
    // Presuming a routing structure where one can view the section.
    // Replace with the exact UI path if available.
    navigate(`/dashboard/scheduling/sections?search=${sectionIdentifier}`);
  };

  return (
    <div className="conflict-modal-overlay">
      <div className="conflict-modal">
        <div className="conflict-modal-header">
          <h2>Scheduling Conflict Detected</h2>
        </div>
        <div className="conflict-modal-body">
          <p>{friendlyMessage}</p>
        </div>
        <div className="conflict-modal-footer">
          {sectionIdentifier && sectionIdentifier !== 'Self' && (
            <button className="btn-view" onClick={handleViewConflict}>
              View Conflicting Section
            </button>
          )}
          <button className="btn-close" onClick={handleClose}>
            Acknowledge & Edit
          </button>
        </div>
      </div>
    </div>
  );
}
