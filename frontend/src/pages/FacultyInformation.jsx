import React, { useEffect, useMemo, useState } from 'react';
import { FiBriefcase, FiEdit2, FiInfo, FiMail, FiPhone, FiPlus, FiSearch, FiTrash2, FiUserCheck, FiX, FiPower, FiChevronLeft, FiChevronRight, FiFilter } from 'react-icons/fi';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import FilterDropdown from '../components/FilterDropdown';
import AddFacultyForm from '../components/AddFacultyForm';
import femaleImage from '../assets/images/female.jpg';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import '../styles/StudentInformation.css';

const FacultyInformation = () => {
  const navigate = useNavigate();
  const { employeeId: selectedEmployeeId } = useParams();
  const { isAdmin } = useAuth();
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
  const limit = 10;
  
  const [showFilters, setShowFilters] = useState(false);
  const [specializationOptions, setSpecializationOptions] = useState([]);

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
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // reset to page 1 on search
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // When filters change, sync to URL and load data
  useEffect(() => {
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
  }, [debouncedQuery, departmentFilter, employmentTypeFilter, statusFilter, specializationFilter, page, limit, setSearchParams]);

  const loadFaculty = async (queryString) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/faculty?${queryString}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      
      const totalPagesHeader = res.headers.get('X-Total-Pages');
      const totalCountHeader = res.headers.get('X-Total-Count');
      if (totalPagesHeader) setTotalPages(parseInt(totalPagesHeader, 10));
      if (totalCountHeader) setTotalRecords(parseInt(totalCountHeader, 10));

      if (Array.isArray(data)) {
        setFaculty(data);
      } else {
        setFaculty([]);
      }
      setLoadError('');
    } catch {
      setLoadError('Could not load faculty records. Please try again.');
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
    setSelectedFaculty(match || null);
  }, [selectedEmployeeId, faculty]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setDepartmentFilter("");
    setEmploymentTypeFilter("");
    setStatusFilter("");
    setSpecializationFilter("");
    setPage(1);
  };
  
  const activeFilterCount = (departmentFilter ? 1 : 0) + (employmentTypeFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (specializationFilter ? 1 : 0);

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

  const toggleStatus = async (member) => {
    const newStatus = member.status === 'Inactive' ? 'Active' : 'Inactive';
    let payload = { status: newStatus };
    if (newStatus === 'Inactive') {
      const reason = window.prompt("Please provide a reason for deactivating this faculty member:");
      if (!reason) return; // cancelled
      payload.inactiveReason = reason;
    } else {
      payload.inactiveReason = '';
    }

    try {
      const res = await apiFetch(`/api/faculty/${member.employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update status');
      setSuccessMessage(`Faculty status changed to ${newStatus}.`);
      // It will reload based on URL params due to the dependency not triggering exactly, but we can call loadFaculty with current searchParams
      loadFaculty(searchParams.toString());
    } catch (err) {
      setLoadError('Could not update faculty status.');
    }
  };

  return (
    <div className="student-directory">
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

      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by employee ID, name, department, or position"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="toolbar-meta flex items-center justify-between gap-4">
            <span className="meta-chip">
              Showing {faculty.length} faculty (Total: {totalRecords})
            </span>
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
                className="inline-flex min-h-[44px] min-w-[180px] items-center justify-center whitespace-nowrap rounded-xl bg-[#ff7f00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e67300] focus:outline-none focus:ring-2 focus:ring-[#fff3e6]"
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
          <div className="filter-panel">
            <div className="filter-grid">
              <FilterDropdown
                label="Department"
                value={departmentFilter}
                options={[
                  { value: 'IT', label: 'IT' },
                  { value: 'CS', label: 'CS' }
                ]}
                onChange={(val) => { setDepartmentFilter(val); setPage(1); }}
                onClear={() => { setDepartmentFilter(''); setPage(1); }}
                placeholder="All Departments"
                disabled={loading}
              />
              <FilterDropdown
                label="Employment Type"
                value={employmentTypeFilter}
                options={[
                  { value: 'Full-time', label: 'Full-time' },
                  { value: 'Part-time', label: 'Part-time' }
                ]}
                onChange={(val) => { setEmploymentTypeFilter(val); setPage(1); }}
                onClear={() => { setEmploymentTypeFilter(''); setPage(1); }}
                placeholder="All Types"
                disabled={loading}
              />
              <FilterDropdown
                label="Status"
                value={statusFilter}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' }
                ]}
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
            {activeFilterCount > 0 && (
              <div className="active-filters-strip" style={{ marginTop: '12px' }}>
                <button type="button" onClick={clearFilters} className="text-sm font-medium text-red-600 hover:text-red-800 underline">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
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
              {faculty.map((member) => (
                <tr key={member.employeeId || member._id} onClick={() => navigate(`/dashboard/faculty/directory/${encodeURIComponent(member.employeeId)}`)} className={member.status === 'Inactive' ? 'grayscale opacity-60' : ''}>
                  <td className="id-cell">
                    <span className="id-badge">{member.employeeId || '-'}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <FiBriefcase />
                      <span>{[member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ') || '-'}</span>
                    </div>
                  </td>
                  <td>{member.department || '-'}</td>
                  <td>{member.position || '-'}</td>
                  <td>{member.employmentType || '-'}</td>
                  <td>
                    {member.specializations?.length 
                      ? member.specializations.map(s => s.name || s).join(', ') 
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
                        onClick={() => navigate(`/dashboard/faculty/directory/${encodeURIComponent(member.employeeId)}`)}
                      >
                        <FiInfo />
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
                            aria-label="Toggle status"
                            title="Toggle Status"
                            onClick={() => toggleStatus(member)}
                          >
                            <FiPower />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!faculty.length && (
                <tr>
                  <td colSpan="8" className="empty-row text-center py-8">
                    No faculty records found. <br />
                    {isAdmin && (
                      <button onClick={openCreateForm} className="text-[#ff7f00] underline mt-2 hover:text-[#e67300]">
                        Click here to add a new faculty member.
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 flex items-center"
          >
            <FiChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-gray-700">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 flex items-center"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      )}

      {selectedFaculty ? (
        <div className="student-modal-backdrop" onClick={() => navigate('/dashboard/faculty/directory')}>
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            <div className="breadcrumb-bar">
              <button className="breadcrumb-link" type="button" onClick={() => navigate('/dashboard/faculty/directory')}>
                Directory
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">
                Profile
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
                      setSelectedFaculty(null);
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
                  onClick={() => navigate('/dashboard/faculty/directory')}
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
                <input className="readonly-field" type="text" value={String(selectedFaculty.yearsOfService ?? 0)} readOnly />
              </div>
              <div>
                <p className="label">Date of Birth</p>
                <input className="readonly-field" type="text" value={selectedFaculty.dob || '-'} readOnly />
              </div>
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

      {isFormOpen ? (
        <AddFacultyForm
          mode={formMode}
          initialData={formTarget}
          targetEmployeeId={formTarget?.employeeId}
          nextEmployeeId={nextEmployeeId}
          onClose={() => setIsFormOpen(false)}
          onCreated={(createdFaculty) => {
            setQuery('');
            clearFilters();
            setSuccessMessage('Faculty profile created successfully.');
            // loadFaculty automatically called since clearFilters resets state to default
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
