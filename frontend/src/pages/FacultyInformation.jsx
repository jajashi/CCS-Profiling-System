import React, { useCallback, useEffect, useState } from 'react';
import {
  FiBriefcase,
  FiEdit2,
  FiEye,
  FiInfo,
  FiPlus,
  FiPower,
  FiUserCheck,
  FiX,
} from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import AddFacultyForm from '../components/AddFacultyForm';
import femaleImage from '../assets/images/female.jpg';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import '../styles/StudentInformation.css';

const PAGE_SIZE = 50;
const DIRECTORY_BASE = '/dashboard/faculty/directory';

function formatSpecializations(member) {
  const list = member?.specializations;
  if (!Array.isArray(list) || list.length === 0) return '—';
  return list
    .map((item) => (item && typeof item === 'object' && item.name ? item.name : String(item)))
    .filter(Boolean)
    .join(', ');
}

function buildFacultyPutPayload(faculty) {
  const specIds = Array.isArray(faculty.specializations)
    ? faculty.specializations.map((s) => (s && typeof s === 'object' && s._id ? s._id : s))
    : [];
  return {
    firstName: faculty.firstName,
    middleName: faculty.middleName || '',
    lastName: faculty.lastName,
    dob: faculty.dob,
    department: faculty.department,
    profileAvatar: faculty.profileAvatar || '',
    institutionalEmail: faculty.institutionalEmail,
    personalEmail: faculty.personalEmail || '',
    mobileNumber: faculty.mobileNumber,
    emergencyContactName: faculty.emergencyContactName || '',
    emergencyContactNumber: faculty.emergencyContactNumber || '',
    position: faculty.position,
    employmentType: faculty.employmentType,
    contractType: faculty.contractType || '',
    dateHired: faculty.dateHired,
    status: faculty.status,
    inactiveReason: faculty.inactiveReason || '',
    highestEducation: faculty.highestEducation,
    fieldOfStudy: faculty.fieldOfStudy,
    certifications: faculty.certifications || '',
    specializations: specIds,
    internalNotes: faculty.internalNotes || '',
    updatedAt: faculty.updatedAt,
  };
}

const FacultyInformation = () => {
  const navigate = useNavigate();
  const { employeeId: selectedEmployeeId } = useParams();
  const { isAdmin } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formTarget, setFormTarget] = useState(null);
  const [nextEmployeeIdPreview, setNextEmployeeIdPreview] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [togglingEmployeeId, setTogglingEmployeeId] = useState('');
  const [statusModal, setStatusModal] = useState(null);

  const loadFaculty = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/faculty?page=${pageNum}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = await res.json();
      if (json && Array.isArray(json.faculty)) {
        setFaculty(json.faculty);
        setTotalCount(json.total ?? json.faculty.length);
        setCurrentPage(json.currentPage ?? pageNum);
        setTotalPages(json.totalPages ?? 1);
      } else if (Array.isArray(json)) {
        setFaculty(json);
        setTotalCount(json.length);
        setCurrentPage(1);
        setTotalPages(1);
      } else {
        setFaculty([]);
        setTotalCount(0);
        setCurrentPage(1);
        setTotalPages(1);
      }
      setLoadError('');
    } catch {
      setLoadError('Could not load faculty records. Please try again.');
      setFaculty([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaculty(1);
  }, [loadFaculty]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setSelectedFaculty(null);
      return;
    }
    const match = faculty.find((member) => String(member.employeeId) === String(selectedEmployeeId));
    if (match) {
      setSelectedFaculty(match);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/faculty/${encodeURIComponent(selectedEmployeeId)}`);
        if (!res.ok) throw new Error('not found');
        const data = await res.json();
        if (!cancelled) setSelectedFaculty(data);
      } catch {
        if (!cancelled) setSelectedFaculty(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedEmployeeId, faculty]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const openCreateForm = async () => {
    setFormMode('create');
    setFormTarget(null);
    setNextEmployeeIdPreview('');
    try {
      const res = await apiFetch('/api/faculty/next-id');
      if (res.ok) {
        const data = await res.json();
        setNextEmployeeIdPreview(data.employeeId || '');
      }
    } catch {
      setNextEmployeeIdPreview('');
    }
    setIsFormOpen(true);
  };

  const openEditForm = async (employeeId) => {
    try {
      const res = await apiFetch(`/api/faculty/${encodeURIComponent(employeeId)}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setFormMode('edit');
      setFormTarget(data);
      setIsFormOpen(true);
    } catch {
      setLoadError('Could not load faculty details for editing. Please try again.');
    }
  };

  const goToProfile = (member) => {
    navigate(`${DIRECTORY_BASE}/${encodeURIComponent(member.employeeId)}`);
  };

  const applyStatusChange = async (member, nextStatus, inactiveReason) => {
    setTogglingEmployeeId(member.employeeId);
    setLoadError('');
    try {
      const res = await apiFetch(`/api/faculty/${encodeURIComponent(member.employeeId)}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      const payload = buildFacultyPutPayload(data);
      payload.status = nextStatus;
      payload.inactiveReason = nextStatus === 'Inactive' ? inactiveReason : '';

      const putRes = await apiFetch(`/api/faculty/${encodeURIComponent(member.employeeId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updated = await putRes.json().catch(() => null);
      if (!putRes.ok) {
        setLoadError(updated?.message || 'Could not update status. Please try again.');
        return;
      }
      setFaculty((prev) => prev.map((row) => (row.employeeId === updated.employeeId ? updated : row)));
      setSelectedFaculty((prev) => (prev && prev.employeeId === updated.employeeId ? updated : prev));
      setSuccessMessage(
        nextStatus === 'Active' ? 'Faculty member activated.' : 'Faculty member deactivated.',
      );
      await loadFaculty(currentPage);
      setStatusModal(null);
    } catch {
      setLoadError('Could not update status. Please try again.');
    } finally {
      setTogglingEmployeeId('');
    }
  };

  const handleToggleClick = (member, e) => {
    e.stopPropagation();
    if (togglingEmployeeId) return;
    if (member.status === 'Inactive') {
      setStatusModal({ member, nextStatus: 'Active', needsReason: false });
    } else {
      setStatusModal({ member, nextStatus: 'Inactive', needsReason: true, reason: '' });
    }
  };

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <div className="student-directory">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiUserCheck />
        </div>
        <div>
          <p className="directory-hero-title">Faculty Directory</p>
          <p className="directory-hero-subtitle">
            <FiInfo />
            <span>Browse the full roster and open profiles or quick actions from one table.</span>
          </p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar faculty-directory-toolbar">
          <div className="toolbar-meta flex w-full items-center justify-between gap-4">
            <span className="meta-chip">
              {loading ? 'Loading…' : `${rangeStart}–${rangeEnd} of ${totalCount} faculty`}
            </span>
            {isAdmin ? (
              <button
                type="button"
                onClick={openCreateForm}
                className="add-student-btn"
                aria-label="Add new faculty"
                disabled={loading}
              >
                <FiPlus />
                <span>Add New Faculty</span>
              </button>
            ) : null}
          </div>
        </div>

        {successMessage ? <div className="page-success-alert">{successMessage}</div> : null}

        {loadError ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        <div className="table-responsive">
          <table className="student-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Full Name</th>
                <th>Department</th>
                <th>Position</th>
                <th>Employment Type</th>
                <th>Specializations</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="skeleton-row">
                      <td colSpan="8">
                        <span className="skeleton-block" />
                      </td>
                    </tr>
                  ))
                : faculty.map((member) => {
                    const isInactive = String(member.status || '').toLowerCase() === 'inactive';
                    return (
                      <tr
                        key={member.employeeId || member._id}
                        className={isInactive ? 'row-inactive' : ''}
                        onClick={() => goToProfile(member)}
                      >
                        <td className="id-cell">
                          <span className="id-badge">{member.employeeId || '-'}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <FiBriefcase />
                            <span>
                              {[member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ') ||
                                '—'}
                            </span>
                          </div>
                        </td>
                        <td>{member.department || '—'}</td>
                        <td>{member.position || '—'}</td>
                        <td>{member.employmentType || '—'}</td>
                        <td className="specializations-cell">{formatSpecializations(member)}</td>
                        <td>
                          <span
                            className={`status-badge status-${String(member.status || 'active').toLowerCase()}`}
                          >
                            {member.status || 'Active'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="action-btn view"
                              type="button"
                              aria-label="View profile"
                              title="View profile"
                              onClick={() => goToProfile(member)}
                            >
                              <FiEye />
                            </button>
                            {isAdmin ? (
                              <>
                                <button
                                  className="action-btn edit"
                                  type="button"
                                  aria-label="Edit faculty"
                                  title="Edit faculty"
                                  onClick={() => openEditForm(member.employeeId)}
                                >
                                  <FiEdit2 />
                                </button>
                                <button
                                  className={`action-btn toggle ${isInactive ? 'toggle-on' : ''}`}
                                  type="button"
                                  aria-label={isInactive ? 'Activate faculty' : 'Deactivate faculty'}
                                  title={isInactive ? 'Activate' : 'Deactivate'}
                                  disabled={togglingEmployeeId === member.employeeId}
                                  onClick={(e) => handleToggleClick(member, e)}
                                >
                                  <FiPower />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              {!loading && !faculty.length ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    <div className="faculty-empty-state">
                      <p className="faculty-empty-title">No faculty records found</p>
                      {isAdmin ? (
                        <button type="button" className="faculty-empty-link" onClick={openCreateForm}>
                          Add a new faculty member
                        </button>
                      ) : (
                        <p className="faculty-empty-sub">Check back after administrators add records.</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 ? (
          <div className="table-pagination">
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage <= 1}
              onClick={() => loadFaculty(currentPage - 1)}
            >
              Previous
            </button>
            <span className="pagination-meta">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage >= totalPages}
              onClick={() => loadFaculty(currentPage + 1)}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      {selectedFaculty ? (
        <div className="student-modal-backdrop" onClick={() => navigate(DIRECTORY_BASE)}>
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            <div className="breadcrumb-bar">
              <button className="breadcrumb-link" type="button" onClick={() => navigate(DIRECTORY_BASE)}>
                Directory
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">
                {selectedFaculty.firstName} {selectedFaculty.lastName}
              </span>
            </div>
            <div className="modal-header">
              <div className="profile-header">
                <img
                  className="profile-avatar"
                  src={selectedFaculty.profileAvatar || femaleImage}
                  alt={`${selectedFaculty.firstName} ${selectedFaculty.lastName}`}
                />
                <div>
                  <p className="modal-eyebrow">Faculty Details</p>
                  <h3>
                    {selectedFaculty.firstName} {selectedFaculty.middleName} {selectedFaculty.lastName}
                  </h3>
                  <p className="modal-subtitle">Employee ID: {selectedFaculty.employeeId}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      navigate(DIRECTORY_BASE);
                      openEditForm(selectedFaculty.employeeId);
                    }}
                    className="modal-edit-btn"
                  >
                    <FiEdit2 />
                    <span>Edit Profile</span>
                  </button>
                ) : null}
                <button
                  className="modal-close"
                  onClick={() => navigate(DIRECTORY_BASE)}
                  aria-label="Close dialog"
                  type="button"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="modal-grid">
              <div>
                <p className="label">Department</p>
                <input className="readonly-field" type="text" value={selectedFaculty.department || '-'} readOnly />
              </div>
              <div>
                <p className="label">Position</p>
                <input className="readonly-field" type="text" value={selectedFaculty.position || '-'} readOnly />
              </div>
              <div>
                <p className="label">Employment Type</p>
                <input className="readonly-field" type="text" value={selectedFaculty.employmentType || '-'} readOnly />
              </div>
              <div>
                <p className="label">Specializations</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={formatSpecializations(selectedFaculty)}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Contract Type</p>
                <input className="readonly-field" type="text" value={selectedFaculty.contractType || '-'} readOnly />
              </div>
              <div>
                <p className="label">Status</p>
                <input className="readonly-field" type="text" value={selectedFaculty.status || 'Active'} readOnly />
              </div>
              <div>
                <p className="label">Date Hired</p>
                <input className="readonly-field" type="text" value={selectedFaculty.dateHired || '-'} readOnly />
              </div>
              <div>
                <p className="label">Years of Service</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={String(selectedFaculty.yearsOfService ?? 0)}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Date of Birth</p>
                <input className="readonly-field" type="text" value={selectedFaculty.dob || '-'} readOnly />
              </div>
              <div>
                <p className="label">Institutional Email</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedFaculty.institutionalEmail || '-'}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Personal Email</p>
                <input className="readonly-field" type="text" value={selectedFaculty.personalEmail || '-'} readOnly />
              </div>
              <div>
                <p className="label">Mobile Number</p>
                <input className="readonly-field" type="text" value={selectedFaculty.mobileNumber || '-'} readOnly />
              </div>
              <div>
                <p className="label">Emergency Contact</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={
                    selectedFaculty.emergencyContactName
                      ? `${selectedFaculty.emergencyContactName} (${selectedFaculty.emergencyContactNumber || '-'})`
                      : '-'
                  }
                  readOnly
                />
              </div>
              <div>
                <p className="label">Highest Education</p>
                <input className="readonly-field" type="text" value={selectedFaculty.highestEducation || '-'} readOnly />
              </div>
              <div>
                <p className="label">Field of Study</p>
                <input className="readonly-field" type="text" value={selectedFaculty.fieldOfStudy || '-'} readOnly />
              </div>
              <div>
                <p className="label">Certifications / Licenses</p>
                <input className="readonly-field" type="text" value={selectedFaculty.certifications || '-'} readOnly />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {statusModal ? (
        <div className="student-modal-backdrop status-reason-backdrop" onClick={() => setStatusModal(null)}>
          <div className="student-modal status-reason-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">Update status</p>
                <h3>{statusModal.nextStatus === 'Inactive' ? 'Deactivate faculty' : 'Activate faculty'}</h3>
                <p className="modal-subtitle">
                  {statusModal.member.firstName} {statusModal.member.lastName} ({statusModal.member.employeeId})
                </p>
              </div>
              <button className="modal-close" type="button" aria-label="Close" onClick={() => setStatusModal(null)}>
                <FiX />
              </button>
            </div>
            {statusModal.needsReason ? (
              <>
                <label className="status-reason-label" htmlFor="inactive-reason">
                  Reason for deactivation (required)
                </label>
                <textarea
                  id="inactive-reason"
                  className="status-reason-input"
                  rows={4}
                  value={statusModal.reason}
                  onChange={(e) => setStatusModal((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Brief reason for HR records…"
                />
              </>
            ) : (
              <p className="status-reason-hint">This will restore the faculty member to Active status.</p>
            )}
            <div className="status-reason-actions">
              <button type="button" className="pagination-btn" onClick={() => setStatusModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="add-student-btn"
                disabled={
                  togglingEmployeeId ||
                  (statusModal.needsReason && !String(statusModal.reason || '').trim())
                }
                onClick={() => {
                  if (statusModal.needsReason) {
                    const reason = String(statusModal.reason || '').trim();
                    if (!reason) return;
                    applyStatusChange(statusModal.member, 'Inactive', reason);
                  } else {
                    applyStatusChange(statusModal.member, 'Active', '');
                  }
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <AddFacultyForm
          mode={formMode}
          initialData={formTarget}
          targetEmployeeId={formTarget?.employeeId}
          nextEmployeeId={nextEmployeeIdPreview}
          onClose={() => setIsFormOpen(false)}
          onCreated={() => {
            setSuccessMessage('Faculty profile created successfully.');
            loadFaculty(1);
          }}
          onUpdated={(updatedFaculty) => {
            setFaculty((prev) =>
              prev.map((item) => (item.employeeId === updatedFaculty.employeeId ? updatedFaculty : item)),
            );
            setSelectedFaculty(updatedFaculty);
            setSuccessMessage('Faculty profile updated successfully.');
            loadFaculty(currentPage);
          }}
        />
      ) : null}
    </div>
  );
};

export default FacultyInformation;
