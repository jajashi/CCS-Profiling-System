import React, { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiEye, FiInfo, FiPlus, FiSearch, FiUserCheck, FiUsers, FiX, FiPower, FiChevronLeft, FiChevronRight, FiFilter, FiChevronDown, FiChevronUp, FiLoader } from 'react-icons/fi';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import FilterDropdown from '../../../components/Elements/FilterDropdown';
import AddFacultyForm from '../components/AddFacultyForm';
import femaleImage from '../../../assets/images/female.jpg';
import { useAuth } from '../../../providers/AuthContext';
import { apiFetch } from '../../../lib/api';
import '../../students/routes/StudentInformation.css';

const CollapsibleSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="profile-section" style={{ marginBottom: '1rem', border: '1px solid #e5edf5', borderRadius: '12px', background: '#fff', overflow: 'hidden', padding: 0 }}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#f9fbfd', border: 'none', cursor: 'pointer', textAlign: 'left', outline: 'none' }}
      >
        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{title}</span>
        {isOpen ? <FiChevronUp color="#5f6368" /> : <FiChevronDown color="#5f6368" />}
      </button>
      {isOpen && (
        <div style={{ padding: '1.25rem', borderTop: '1px solid #e5edf5' }}>
          {children}
        </div>
      )}
    </div>
  );
};

const FACULTY_DEPARTMENT_OPTIONS = [
  { value: 'IT', label: 'IT' },
  { value: 'CS', label: 'CS' },
];
const FACULTY_EMPLOYMENT_OPTIONS = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
];
const FACULTY_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const INACTIVE_REASON_PRESETS = ['Resigned', 'Retired', 'On Leave', 'Terminated', 'Other'];

function buildDeactivateReason(category, otherDetail) {
  if (category === 'Other') {
    const d = String(otherDetail || '').trim();
    return d ? `Other: ${d}` : '';
  }
  return String(category || '').trim();
}

const FACULTY_DIRECTORY_PATH = '/dashboard/faculty/directory';

const FacultyInformation = () => {
  const navigate = useNavigate();
  const { employeeId: selectedEmployeeId } = useParams();
  const { isAdmin, isFaculty, user } = useAuth();

  const isOwnFacultyProfile =
    isFaculty &&
    user?.employeeId &&
    selectedEmployeeId &&
    String(selectedEmployeeId).toLowerCase() === String(user.employeeId).toLowerCase();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('department') || '');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState(searchParams.get('employmentType') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [specializationFilter, setSpecializationFilter] = useState(searchParams.get('specialization') || '');
  
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [overallTotalRecords, setOverallTotalRecords] = useState(0);
  const [pageInput, setPageInput] = useState('1');
  const limit = 10;
  
  const [showFilters, setShowFilters] = useState(false);
  const [specializationOptions, setSpecializationOptions] = useState([]);
  
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formTarget, setFormTarget] = useState(null);
  const [deactivateModalMember, setDeactivateModalMember] = useState(null);
  const [deactivateReasonCategory, setDeactivateReasonCategory] = useState('');
  const [deactivateReasonOther, setDeactivateReasonOther] = useState('');
  const [deactivateModalError, setDeactivateModalError] = useState('');
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);

  const goToDirectory = () => {
    const s = searchParams.toString();
    navigate(s ? { pathname: FACULTY_DIRECTORY_PATH, search: `?${s}` } : FACULTY_DIRECTORY_PATH);
  };

  const facultyProfilePath = (employeeId) =>
    `/dashboard/faculty/profile/${encodeURIComponent(employeeId)}`;

  useEffect(() => {
    const fetchSpecs = async () => {
      try {
        const res = await apiFetch('/api/specializations');
        if (res.ok) {
          const data = await res.json();
          setSpecializationOptions(data.map(d => ({ label: d.name, value: d.name })));
        }
      } catch (err) {
        // ignore error
      }
    };
    fetchSpecs();
  }, []);

  useEffect(() => {
    const fetchOverallFacultyCount = async () => {
      try {
        const res = await apiFetch('/api/faculty?page=1&limit=1');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setOverallTotalRecords(data.length);
          return;
        }
        if (data && Number.isFinite(data.total)) {
          setOverallTotalRecords(data.total);
        }
      } catch {
        // ignore error
      }
    };
    fetchOverallFacultyCount();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // reset to page 1 on search
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPageInput(String(page || 1));
  }, [page]);

  useEffect(() => {
    if (!isAdmin || searchParams.get('add') !== '1') return undefined;
    setIsFormOpen(true);
    setFormMode('create');
    setFormTarget(null);
    const next = new URLSearchParams(searchParams);
    next.delete('add');
    setSearchParams(next, { replace: true });
    return undefined;
  }, [isAdmin, searchParams, setSearchParams]);

  useEffect(() => {
    if (isOwnFacultyProfile) return undefined;
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('search', debouncedQuery);
    if (departmentFilter) params.set('department', departmentFilter);
    if (employmentTypeFilter) params.set('employmentType', employmentTypeFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (specializationFilter) params.set('specialization', specializationFilter);
    params.set('page', page);
    params.set('limit', limit);
    setSearchParams(params, { replace: true });

    loadFaculty(params.toString());
    return undefined;
  }, [
    isOwnFacultyProfile,
    debouncedQuery,
    departmentFilter,
    employmentTypeFilter,
    statusFilter,
    specializationFilter,
    page,
    limit,
    setSearchParams,
  ]);

  const loadFaculty = async (queryString) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/faculty?${queryString}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setFaculty(data);
        setTotalRecords(data.length);
        setTotalPages(1);
        if (!hasSearchOrFilters) {
          setOverallTotalRecords(data.length);
        }
      } else if (data && Array.isArray(data.faculty)) {
        setFaculty(data.faculty);
        setTotalRecords(Number.isFinite(data.total) ? data.total : data.faculty.length);
        setTotalPages(Number.isFinite(data.totalPages) ? data.totalPages : 1);
        if (!hasSearchOrFilters) {
          setOverallTotalRecords(Number.isFinite(data.total) ? data.total : data.faculty.length);
        }
        if (Number.isFinite(data.currentPage)) {
          setPage(data.currentPage);
        }
      } else {
        setFaculty([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
      setLoadError('');
    } catch {
      setLoadError('Could not load faculty records. Please try again.');
      setFaculty([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

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

    const fetchIndividual = async () => {
      try {
        const res = await apiFetch(`/api/faculty/${selectedEmployeeId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedFaculty(data);
        } else {
          setSelectedFaculty(null);
        }
      } catch (err) {
        setSelectedFaculty(null);
      }
    };
    fetchIndividual();
  }, [selectedEmployeeId, faculty]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleClearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setDepartmentFilter("");
    setEmploymentTypeFilter("");
    setStatusFilter("");
    setSpecializationFilter("");
    setPage(1);
  };

  const activeFilterCount = (departmentFilter ? 1 : 0) + (employmentTypeFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (specializationFilter ? 1 : 0);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (departmentFilter) {
      const opt = FACULTY_DEPARTMENT_OPTIONS.find((o) => o.value === departmentFilter);
      filters.push({
        label: opt ? opt.label : departmentFilter,
        value: departmentFilter,
        type: 'department',
      });
    }
    if (employmentTypeFilter) {
      const opt = FACULTY_EMPLOYMENT_OPTIONS.find((o) => o.value === employmentTypeFilter);
      filters.push({
        label: opt ? opt.label : employmentTypeFilter,
        value: employmentTypeFilter,
        type: 'employmentType',
      });
    }
    if (statusFilter) {
      const opt = FACULTY_STATUS_OPTIONS.find((o) => o.value === statusFilter);
      filters.push({
        label: opt ? opt.label : statusFilter,
        value: statusFilter,
        type: 'status',
      });
    }
    if (specializationFilter) {
      const opt = specializationOptions.find((o) => o.value === specializationFilter);
      filters.push({
        label: opt ? opt.label : specializationFilter,
        value: specializationFilter,
        type: 'specialization',
      });
    }
    return filters;
  }, [
    departmentFilter,
    employmentTypeFilter,
    statusFilter,
    specializationFilter,
    specializationOptions,
  ]);

  const removeActiveFilter = (filter) => {
    setPage(1);
    switch (filter.type) {
      case 'department':
        setDepartmentFilter('');
        break;
      case 'employmentType':
        setEmploymentTypeFilter('');
        break;
      case 'status':
        setStatusFilter('');
        break;
      case 'specialization':
        setSpecializationFilter('');
        break;
      default:
        break;
    }
  };

  const hasSearchOrFilters =
    String(debouncedQuery || '').trim() !== '' || activeFilterCount > 0;
  const matchingFacultyCount = hasSearchOrFilters ? totalRecords : overallTotalRecords;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const handlePageJump = () => {
    const parsed = Number.parseInt(String(pageInput || '').trim(), 10);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(page || 1));
      return;
    }
    const nextPage = Math.min(Math.max(parsed, 1), Math.max(totalPages || 1, 1));
    setPageInput(String(nextPage));
    if (nextPage !== page) {
      setPage(nextPage);
    }
  };

  const nextEmployeeId = useMemo(() => {
    const year = new Date().getUTCFullYear();
    const prefix = `FAC-${year}-`;
    const maxSuffix = faculty
      .map((member) => String(member.employeeId || ''))
      .filter((id) => id.startsWith(prefix))
      .map((id) => Number.parseInt(id.slice(prefix.length), 10))
      .filter((value) => Number.isInteger(value))
      .reduce((max, current) => (current > max ? current : max), 0);
    return `${prefix}${String(maxSuffix + 1).padStart(3, '0')}`;
  }, [faculty]);

  const openCreateForm = () => {
    setFormMode('create');
    setFormTarget(null);
    setIsFormOpen(true);
  };

  const openEditForm = async (employeeId) => {
    try {
      const res = await apiFetch(`/api/faculty/${employeeId}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setFormMode('edit');
      setFormTarget(data);
      setIsFormOpen(true);
    } catch {
      setLoadError('Could not load faculty details for editing. Please try again.');
    }
  };

  const openDeactivateModal = (member) => {
    setDeactivateModalMember(member);
    setDeactivateReasonCategory('');
    setDeactivateReasonOther('');
    setDeactivateModalError('');
  };

  const resetDeactivateModal = () => {
    setDeactivateModalMember(null);
    setDeactivateReasonCategory('');
    setDeactivateReasonOther('');
    setDeactivateModalError('');
    setDeactivateSubmitting(false);
  };

  const requestCloseDeactivateModal = () => {
    if (deactivateSubmitting) return;
    resetDeactivateModal();
  };

  const applyFacultyStatusChange = async (member, newStatus, inactiveReason) => {
    const getRes = await apiFetch(`/api/faculty/${member.employeeId}`);
    if (!getRes.ok) throw new Error('Failed to load faculty details');
    const current = await getRes.json();

    const payload = {
      firstName: current.firstName || '',
      middleName: current.middleName || '',
      lastName: current.lastName || '',
      dob: current.dob || '',
      department: current.department || '',
      profileAvatar: current.profileAvatar || '',
      institutionalEmail: current.institutionalEmail || '',
      personalEmail: current.personalEmail || '',
      mobileNumber: current.mobileNumber || '',
      emergencyContactName: current.emergencyContactName || '',
      emergencyContactNumber: current.emergencyContactNumber || '',
      position: current.position || '',
      employmentType: current.employmentType || '',
      contractType: current.contractType || '',
      dateHired: current.dateHired || '',
      status: newStatus,
      inactiveReason: newStatus === 'Inactive' ? inactiveReason : '',
      highestEducation: current.highestEducation || '',
      fieldOfStudy: current.fieldOfStudy || '',
      certifications: current.certifications || '',
      specializations: Array.isArray(current.specializations)
        ? current.specializations.map((s) => (s && typeof s === 'object' ? s._id || s.name || '' : s)).filter(Boolean)
        : [],
      internalNotes: current.internalNotes || '',
      updatedAt: current.updatedAt,
    };

    const res = await apiFetch(`/api/faculty/${member.employeeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update status');
    setSuccessMessage(`Faculty status changed to ${newStatus}.`);
    loadFaculty(searchParams.toString());
  };

  const onQuickStatusClick = async (member) => {
    if (member.status === 'Inactive') {
      try {
        await applyFacultyStatusChange(member, 'Active', '');
      } catch {
        setLoadError('Could not update faculty status.');
      }
      return;
    }
    openDeactivateModal(member);
  };

  const confirmDeactivateFromModal = async () => {
    if (!deactivateModalMember) return;
    const reason = buildDeactivateReason(deactivateReasonCategory, deactivateReasonOther);
    if (!deactivateReasonCategory.trim()) {
      setDeactivateModalError('Please select a reason to deactivate this faculty member.');
      return;
    }
    if (deactivateReasonCategory === 'Other' && !String(deactivateReasonOther || '').trim()) {
      setDeactivateModalError('Please describe the reason when selecting Other.');
      return;
    }
    if (!reason) {
      setDeactivateModalError('Please provide a valid reason.');
      return;
    }
    setDeactivateModalError('');
    setDeactivateSubmitting(true);
    try {
      await applyFacultyStatusChange(deactivateModalMember, 'Inactive', reason);
      resetDeactivateModal();
    } catch {
      setDeactivateModalError('Could not update status. Please try again.');
    } finally {
      setDeactivateSubmitting(false);
    }
  };

  return (
    <div className="student-directory">
      {isOwnFacultyProfile ? (
        <div className="profile-hero-student">
          <div className="profile-hero-content">
            <div className="profile-hero-text">
              <h2 className="profile-hero-title">Faculty Profile</h2>
              <p className="profile-hero-subtitle">
                View your employment, contact, and qualification records.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="directory-hero faculty-hero">
          <div className="directory-hero-icon">
            <FiUserCheck />
          </div>
          <div>
            <p className="directory-hero-title">Faculty Information</p>
            <p className="directory-hero-subtitle">
              <FiInfo />
              <span>Manage faculty records and review profile details from one directory.</span>
            </p>
          </div>
        </div>
      )}

      {!isOwnFacultyProfile ? (
        <>
      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by employee ID, name, or institutional email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="toolbar-meta flex items-center justify-between gap-4">
            <div className="student-count-badge">
              <FiUsers />
              <span>{totalRecords} faculty</span>
            </div>
            <button
              type="button"
              className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters((prev) => !prev)}
              title="Toggle advanced filters"
            >
              <FiFilter />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>
            {isAdmin ? (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex min-h-[44px] min-w-[180px] items-center justify-center whitespace-nowrap rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100"
                aria-label="Add new faculty"
                disabled={loading}
              >
                <FiPlus />
                <span>Add New Faculty</span>
              </button>
            ) : null}
          </div>
        </div>

        {showFilters && (
          <>
            <div className="filter-panel">
              <div className="filter-grid">
                <FilterDropdown
                  label="Department"
                  value={departmentFilter}
                  options={FACULTY_DEPARTMENT_OPTIONS}
                  onChange={(val) => { setDepartmentFilter(val); setPage(1); }}
                  onClear={() => { setDepartmentFilter(''); setPage(1); }}
                  placeholder="All Departments"
                  disabled={loading}
                />
                <FilterDropdown
                  label="Employment Type"
                  value={employmentTypeFilter}
                  options={FACULTY_EMPLOYMENT_OPTIONS}
                  onChange={(val) => { setEmploymentTypeFilter(val); setPage(1); }}
                  onClear={() => { setEmploymentTypeFilter(''); setPage(1); }}
                  placeholder="All Types"
                  disabled={loading}
                />
                <FilterDropdown
                  label="Status"
                  value={statusFilter}
                  options={FACULTY_STATUS_OPTIONS}
                  onChange={(val) => { setStatusFilter(val); setPage(1); }}
                  onClear={() => { setStatusFilter(''); setPage(1); }}
                  placeholder="All Status"
                  disabled={loading}
                />
                <FilterDropdown
                  label="Specialization"
                  value={specializationFilter}
                  options={specializationOptions}
                  onChange={(val) => { setSpecializationFilter(val); setPage(1); }}
                  onClear={() => { setSpecializationFilter(''); setPage(1); }}
                  placeholder="All Specializations"
                  disabled={loading}
                />
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="active-filters-strip">
                <span className="active-filters-label">Active filters:</span>
                <div className="active-filters-list">
                  {activeFilters.map((filter) => (
                    <span
                      key={`${filter.type}-${filter.value}`}
                      className="active-filter-chip"
                    >
                      {filter.label}
                      <button
                        type="button"
                        className="active-filter-chip-remove"
                        onClick={() => removeActiveFilter(filter)}
                        aria-label={`Remove ${filter.label} filter`}
                      >
                        <FiX />
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="clear-all-btn"
                  onClick={handleClearFilters}
                  disabled={loading}
                >
                  Clear all
                </button>
              </div>
            )}
          </>
        )}

        {successMessage ? (
          <div className="page-success-alert">
            {successMessage}
          </div>
        ) : null}

        {loadError ? (
          <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {loadError}
          </div>
        ) : null}

        <div className="results-count">
          <div className="results-count-text">
            Showing <strong>{matchingFacultyCount}</strong> out of <strong>{overallTotalRecords}</strong> faculty member
            {overallTotalRecords !== 1 ? 's' : ''}
          </div>
          {totalPages > 1 ? (
            <div className="results-count-pagination" aria-label="Top pagination controls">
              <button
                className="pagination-btn pagination-btn-sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={!hasPrev || loading}
                type="button"
                aria-label="Previous page"
              >
                <FiChevronLeft />
              </button>
              <label className="pagination-input-wrap" aria-label="Page number">
                <span className="pagination-input-label">Page</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  inputMode="numeric"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={handlePageJump}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePageJump();
                    }
                  }}
                  className="pagination-page-input"
                  disabled={loading}
                />
              </label>
              <span className="pagination-info pagination-info-sm">of {totalPages}</span>
              <button
                className="pagination-btn pagination-btn-sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={!hasNext || loading}
                type="button"
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
          ) : null}
        </div>

        <div className="relative">
          {loading && faculty.length > 0 ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70"
              aria-busy="true"
              aria-label="Loading faculty"
            >
              <FiLoader className="animate-spin text-orange-500" size={28} />
            </div>
          ) : null}

          <div className={`table-responsive ${loading && faculty.length > 0 ? 'min-h-[120px]' : ''}`}>
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
              {loading && faculty.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="skeleton-row">
                      <td><span className="skeleton-block" style={{ width: '88px' }} /></td>
                      <td><span className="skeleton-block" style={{ width: '160px' }} /></td>
                      <td><span className="skeleton-block" style={{ width: '48px' }} /></td>
                      <td><span className="skeleton-block" style={{ width: '120px' }} /></td>
                      <td><span className="skeleton-block" style={{ width: '72px' }} /></td>
                      <td><span className="skeleton-block" style={{ width: '100px' }} /></td>
                      <td><span className="skeleton-block" style={{ width: '64px' }} /></td>
                      <td><span className="skeleton-block" style={{ width: '72px' }} /></td>
                    </tr>
                  ))
                : null}
              {!loading && faculty.map((member) => (
                <tr
                  key={member.employeeId || member._id}
                  onClick={() => navigate(facultyProfilePath(member.employeeId))}
                  className={[
                    member.status === 'Inactive' ? 'grayscale opacity-60' : '',
                    String(selectedEmployeeId || '') === String(member.employeeId || '') ? 'row-selected' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <td className="id-cell">
                    <span className="id-badge">{member.employeeId || '-'}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span
                        className={member.status === 'Inactive' ? 'faculty-directory-name-inactive' : undefined}
                      >
                        {[member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ') || '-'}
                      </span>
                    </div>
                  </td>
                  <td>{member.department || '-'}</td>
                  <td>{member.position || '-'}</td>
                  <td>{member.employmentType || '-'}</td>
                  <td>
                    {member.specializations?.length
                      ? member.specializations
                          .map((s) => {
                            const name = typeof s === 'object' ? (s.name || '') : String(s);
                            const desc =
                              typeof s === 'object' && String(s.description || '').trim()
                                ? ` (${s.description})`
                                : '';
                            return name + desc;
                          })
                          .join(', ')
                      : '-'}
                  </td>
                  <td>
                    <span className={`status-badge status-${String(member.status || 'active').toLowerCase()}`}>
                      {member.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="action-btn view"
                        type="button"
                        aria-label="View faculty"
                        title="View faculty"
                        onClick={() => navigate(facultyProfilePath(member.employeeId))}
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
                            className="action-btn delete"
                            type="button"
                            aria-label={member.status === 'Inactive' ? 'Activate faculty' : 'Deactivate faculty'}
                            title={member.status === 'Inactive' ? 'Mark Active' : 'Mark Inactive'}
                            onClick={() => onQuickStatusClick(member)}
                          >
                            <FiPower />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !faculty.length ? (
                <tr>
                  <td colSpan="8" className="empty-row text-center py-8">
                    No faculty records found. <br />
                    {isAdmin && (
                      <button onClick={openCreateForm} className="text-orange-500 underline mt-2 hover:text-orange-600">
                        Click here to add a new faculty member.
                      </button>
                    )}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="pagination-controls">
          <div className="results-count-pagination" aria-label="Bottom pagination controls">
            <button
              className="pagination-btn pagination-btn-sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!hasPrev || loading}
              type="button"
              aria-label="Previous page"
            >
              <FiChevronLeft />
            </button>
            <label className="pagination-input-wrap" aria-label="Page number">
              <span className="pagination-input-label">Page</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                inputMode="numeric"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageJump}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePageJump();
                  }
                }}
                className="pagination-page-input"
                disabled={loading}
              />
            </label>
            <span className="pagination-info pagination-info-sm">of {totalPages}</span>
            <button
              className="pagination-btn pagination-btn-sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={!hasNext || loading}
              type="button"
              aria-label="Next page"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      ) : null}
        </>
      ) : null}

      {selectedFaculty ? (
        <div
          className={isOwnFacultyProfile ? 'student-full-page' : 'student-modal-backdrop'}
          onClick={() => !isOwnFacultyProfile && goToDirectory()}
          role={isOwnFacultyProfile ? undefined : 'presentation'}
        >
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            {!isOwnFacultyProfile ? (
              <div className="breadcrumb-bar">
                <button className="breadcrumb-link" type="button" onClick={goToDirectory}>
                  Faculty Directory
                </button>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">
                  Profile
                </span>
              </div>
            ) : null}
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
                      setSelectedFaculty(null);
                      openEditForm(selectedFaculty.employeeId);
                    }}
                    className="modal-edit-btn"
                  >
                    <FiEdit2 />
                    <span>Edit Profile</span>
                  </button>
                ) : null}
                {!isOwnFacultyProfile ? (
                  <button
                    className="modal-close"
                    onClick={goToDirectory}
                    aria-label="Close dialog"
                    type="button"
                  >
                    <FiX />
                  </button>
                ) : null}
              </div>
            </div>

            {selectedFaculty.status === 'Inactive' && (
              <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#991b1b', fontWeight: '500' }}>
                This faculty member is Inactive — Reason: {selectedFaculty.inactiveReason || 'No reason provided'}
              </div>
            )}

            <div className="profile-details-container" style={{ gap: '0' }}>
              <CollapsibleSection title="Personal Information">
                <div className="modal-grid">
                  <div>
                    <p className="label">Employee ID</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.employeeId || '-'} readOnly />
                  </div>
                  <div>
                    <p className="label">First Name</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.firstName || '-'} readOnly />
                  </div>
                  <div>
                    <p className="label">Middle Name</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.middleName || '-'} readOnly />
                  </div>
                  <div>
                    <p className="label">Last Name</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.lastName || '-'} readOnly />
                  </div>
                  <div>
                    <p className="label">Date of Birth</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.dob || '-'} readOnly />
                  </div>
                  <div>
                    <p className="label">Department</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.department || '-'} readOnly />
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Contact Information">
                <div className="modal-grid">
                  <div>
                    <p className="label">Institutional Email</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.institutionalEmail || '-'} readOnly />
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
                    <p className="label">Emergency Contact Name</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.emergencyContactName || '-'} readOnly />
                  </div>
                  <div>
                    <p className="label">Emergency Contact Number</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.emergencyContactNumber || '-'} readOnly />
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Employment Details">
                <div className="modal-grid">
                  <div>
                    <p className="label">Position</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.position || '-'} readOnly />
                  </div>
                  <div>
                    <p className="label">Employment Type</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.employmentType || '-'} readOnly />
                  </div>
                  <div>
                    <p className="label">Contract Type</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.contractType || '-'} readOnly />
                  </div>
                  <div>
                    <p className="label">Date Hired</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.dateHired || '-'} readOnly />
                  </div>
                  <div>
                    <p className="label">Years of Service</p>
                    <input className="readonly-field" type="text" value={String(selectedFaculty.yearsOfService ?? 0)} readOnly />
                  </div>
                  <div>
                    <p className="label">Status</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.status || 'Active'} readOnly />
                  </div>
                  {selectedFaculty.status === 'Inactive' ? (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p className="label">Reason for inactivation</p>
                      <input
                        className="readonly-field"
                        type="text"
                        value={selectedFaculty.inactiveReason || '-'}
                        readOnly
                      />
                    </div>
                  ) : null}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Academic Qualifications">
                <div className="modal-grid">
                  <div>
                    <p className="label">Highest Education</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.highestEducation || '-'} readOnly />
                  </div>
                  <div>
                    <p className="label">Field of Study</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.fieldOfStudy || '-'} readOnly />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p className="label">Certifications / Licenses</p>
                    <input className="readonly-field" type="text" value={selectedFaculty.certifications || '-'} readOnly />
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Specializations">
                {selectedFaculty.specializations?.length > 0 ? (
                  <div className="skills-grid faculty-spec-read-grid">
                    {selectedFaculty.specializations.map((spec, i) => (
                      <div key={spec._id || i} className="faculty-spec-read-card">
                        <span className="faculty-spec-read-name">{spec.name || spec}</span>
                        {typeof spec === 'object' && String(spec.description || '').trim() ? (
                          <span className="faculty-spec-read-desc">{spec.description}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="skills-empty">No specializations assigned.</p>
                )}
              </CollapsibleSection>

              {!isOwnFacultyProfile ? (
                <CollapsibleSection title="Internal Notes">
                  <textarea
                    className="readonly-field"
                    value={selectedFaculty.internalNotes || 'No internal notes available.'}
                    readOnly
                    style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                  />
                </CollapsibleSection>
              ) : null}

              <CollapsibleSection title="Teaching Load Summary">
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>
                  Teaching load data will be available once the Scheduling module is integrated.
                </div>
              </CollapsibleSection>
            </div>
          </div>
        </div>
      ) : null}

      {deactivateModalMember ? (
        <div
          className="student-modal-backdrop faculty-deactivate-backdrop"
          role="presentation"
          onClick={requestCloseDeactivateModal}
        >
          <div
            className="student-modal faculty-deactivate-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-faculty-title"
            aria-describedby="deactivate-faculty-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="faculty-deactivate-modal__header" role="banner">
              <div className="faculty-deactivate-modal__top-bar">
                <h2 className="faculty-deactivate-modal__top-title" id="deactivate-faculty-title">
                  Confirm Deactivation
                </h2>
                <button
                  type="button"
                  className="modal-close faculty-deactivate-modal__close faculty-deactivate-modal__close--corner"
                  onClick={requestCloseDeactivateModal}
                  aria-label="Close"
                  disabled={deactivateSubmitting}
                >
                  <FiX />
                </button>
              </div>
            </header>

            <div className="faculty-deactivate-modal__body">
              <div className="faculty-deactivate-modal__name-container">
                <h3 className="faculty-deactivate-modal__name">
                  {[
                    deactivateModalMember.firstName,
                    deactivateModalMember.middleName,
                    deactivateModalMember.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ') || 'Faculty member'}
                </h3>
                {deactivateModalMember.employeeId ? (
                  <p className="faculty-deactivate-modal__meta">
                    Employee ID <span>{deactivateModalMember.employeeId}</span>
                  </p>
                ) : null}
              </div>

              <div className="faculty-deactivate-modal__reason-panel">
                <div className="faculty-deactivate-modal__section-head">
                  <h4 className="faculty-deactivate-modal__section-title">SELECT A REASON</h4>
                  <span className="faculty-deactivate-modal__badge">required</span>
                </div>
                <div
                  className="faculty-deactivate-modal__chips"
                  role="group"
                  aria-label="Reason presets"
                >
                  {INACTIVE_REASON_PRESETS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={
                        deactivateReasonCategory === opt
                          ? 'faculty-deactivate-modal__chip is-selected'
                          : 'faculty-deactivate-modal__chip'
                      }
                      onClick={() => {
                        setDeactivateReasonCategory(opt);
                        setDeactivateModalError('');
                        if (opt !== 'Other') setDeactivateReasonOther('');
                      }}
                      disabled={deactivateSubmitting}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {deactivateReasonCategory === 'Other' ? (
                  <div className="faculty-deactivate-modal__other">
                    <label htmlFor="deactivate-reason-other" className="faculty-deactivate-modal__sub-label">
                      Enter reason here <span className="faculty-deactivate-modal__req">(required)</span>
                    </label>
                    <textarea
                      id="deactivate-reason-other"
                      className="faculty-deactivate-modal__textarea"
                      rows={3}
                      value={deactivateReasonOther}
                      onChange={(e) => {
                        setDeactivateReasonOther(e.target.value);
                        setDeactivateModalError('');
                      }}
                      disabled={deactivateSubmitting}
                      placeholder="e.g. End of contract, study leave, etc."
                    />
                  </div>
                ) : null}
              </div>

              {deactivateModalError ? (
                <div className="faculty-deactivate-modal__alert" role="alert">
                  {deactivateModalError}
                </div>
              ) : null}

              <div className="faculty-deactivate-modal__footer">
                {/* <button
                  type="button"
                  className="add-student-btn add-student-secondary faculty-deactivate-modal__btn-cancel"
                  onClick={requestCloseDeactivateModal}
                  disabled={deactivateSubmitting}
                >
                  Cancel
                </button> */}
                <button
                  type="button"
                  className="add-student-btn add-student-primary faculty-deactivate-modal__btn-confirm"
                  onClick={confirmDeactivateFromModal}
                  disabled={deactivateSubmitting}
                >
                  {deactivateSubmitting ? 'Confirming…' : 'Confirm Deactivation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <AddFacultyForm
          mode={formMode}
          initialData={formTarget}
          targetEmployeeId={formTarget?.employeeId}
          nextEmployeeId={nextEmployeeId}
          onClose={() => setIsFormOpen(false)}
          onCreated={(createdFaculty) => {
            setQuery('');
            setDebouncedQuery('');
            handleClearFilters();
            setSuccessMessage('Faculty profile created successfully.');
            // explicitly calling loadFaculty with default query params 
            loadFaculty(new URLSearchParams({ page: 1, limit: limit }).toString());
          }}
          onUpdated={(updatedFaculty) => {
            setSelectedFaculty(updatedFaculty);
            setSuccessMessage('Faculty profile updated successfully.');
            loadFaculty(searchParams.toString());
          }}
        />
      ) : null}
    </div>
  );
};

export default FacultyInformation;
