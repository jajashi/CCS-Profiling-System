import React from "react";
import { FiAlertTriangle, FiTrash2, FiX } from "react-icons/fi";

const DeleteConfirmationModal = ({
  studentName,
  studentId,
  onConfirm,
  onCancel,
  isDeleting,
  error,
}) => {
  return (
    <div
      className="delete-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title">
      <div className="delete-modal">
        <div className="delete-modal-header">
          <div className="delete-modal-icon">
            <FiAlertTriangle />
          </div>
          <h3 id="delete-modal-title">Delete Student Record</h3>
        </div>

        <div className="delete-modal-body">
          <p className="delete-warning-text">
            Are you sure you want to delete this student record? This action
            cannot be undone.
          </p>
          <div className="delete-student-info">
            <p className="student-name">{studentName}</p>
            <p className="student-id">ID: {studentId}</p>
          </div>
          {error && (
            <div className="delete-error-message">
              <FiAlertTriangle className="error-icon" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="delete-modal-actions">
          <button
            type="button"
            className="delete-cancel-btn"
            onClick={onCancel}
            disabled={isDeleting}>
            Cancel
          </button>
          <button
            type="button"
            className="delete-confirm-btn"
            onClick={onConfirm}
            disabled={isDeleting}>
            {isDeleting ? (
              <>
                <span className="spinner" />
                Deleting...
              </>
            ) : (
              <>
                <FiTrash2 />
                Yes, Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
