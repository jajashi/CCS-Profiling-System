import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiSearch, FiEye, FiUser, FiEdit2, FiTrash2, FiInfo, FiX, FiFilter, FiAward, FiUsers, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate, useParams } from 'react-router-dom';
import femaleImage from "../../../assets/images/female.jpg";
import maleImage from "../../../assets/images/male.jpg";
import AddStudentForm from "../components/AddStudentForm";
import DeleteConfirmationModal from "../../../components/Elements/DeleteConfirmationModal";
import FilterDropdown from "../../../components/Elements/FilterDropdown";
import SkillsFilter from "../../../components/Elements/SkillsFilter";
import { useAuth } from '../../../providers/AuthContext';
import { apiFetch, apiGetCached, invalidateApiCache } from "../../../lib/api";
import StudentProfileTabs from "../components/StudentProfileTabs";
import "./StudentInformation.css";

const StudentInformation = () => {
  const navigate = useNavigate();
  const { id: selectedStudentId } = useParams();
  const { isAdmin, isStudent, user } = useAuth();

  useEffect(() => {
    if (isStudent && user?.studentId) {
      if (selectedStudentId !== user.studentId) {
        navigate(`/dashboard/student-info/${user.studentId}`, { replace: true });
      }
    }
  }, [isStudent, user, selectedStudentId, navigate]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentLoadError, setStudentLoadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [studentFormMode, setStudentFormMode] = useState('create');
  const [studentFormTarget, setStudentFormTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [programFilter, setProgramFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState([]);
  const [yearLevelFilter, setYearLevelFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [scholarshipFilter, setScholarshipFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [violationFilter, setViolationFilter] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pageInput, setPageInput] = useState("1");

  const searchInputRef = useRef(null);

  const getStudentAvatar = (student) => {
    if (student?.profileAvatar) return student.profileAvatar;
    const normalized = (student?.gender || '').trim().toLowerCase();
    if (normalized === 'male') return maleImage;
    if (normalized === 'female') return femaleImage;
    return femaleImage;
  };

  const PROGRAM_OPTIONS = [
    { value: 'BSCS', label: 'BS Computer Science' },
    { value: 'BSIT', label: 'BS Information Technology' },
  ];
  const SECTION_OPTIONS = [
    { value: 'CS1A', label: 'CS1A' }, { value: 'CS1B', label: 'CS1B' }, { value: 'CS1C', label: 'CS1C' },
    { value: 'CS2A', label: 'CS2A' }, { value: 'CS2B', label: 'CS2B' }, { value: 'CS2C', label: 'CS2C' },
    { value: 'CS3A', label: 'CS3A' }, { value: 'CS3B', label: 'CS3B' }, { value: 'CS3C', label: 'CS3C' },
    { value: 'CS4A', label: 'CS4A' }, { value: 'CS4B', label: 'CS4B' }, { value: 'CS4C', label: 'CS4C' },
    { value: 'IT1A', label: 'IT1A' }, { value: 'IT1B', label: 'IT1B' }, { value: 'IT1C', label: 'IT1C' },
    { value: 'IT2A', label: 'IT2A' }, { value: 'IT2B', label: 'IT2B' }, { value: 'IT2C', label: 'IT2C' },
    { value: 'IT3A', label: 'IT3A' }, { value: 'IT3B', label: 'IT3B' }, { value: 'IT3C', label: 'IT3C' },
    { value: 'IT4A', label: 'IT4A' }, { value: 'IT4B', label: 'IT4B' }, { value: 'IT4C', label: 'IT4C' },
  ];
  const SKILL_OPTIONS = [
    { value: 'Programming', label: 'Programming' },
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Database Management', label: 'Database Management' },
    { value: 'UI/UX Design', label: 'UI/UX Design' },
    { value: 'Data Analysis', label: 'Data Analysis' },
    { value: 'Communication', label: 'Communication' },
    { value: 'Leadership', label: 'Leadership' },
    { value: 'Problem Solving', label: 'Problem Solving' },
  ];
  const YEAR_LEVEL_OPTIONS = [
    { value: '1', label: 'Year 1' },
    { value: '2', label: 'Year 2' },
    { value: '3', label: 'Year 3' },
    { value: '4', label: 'Year 4' },
  ];
  const STATUS_OPTIONS = [
    { value: 'Enrolled', label: 'Enrolled' },
    { value: 'On Leave', label: 'On Leave' },
    { value: 'Graduating', label: 'Graduating' },
  ];
  const GENDER_OPTIONS = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
  ];
  const VIOLATION_OPTIONS = [
    { value: 'None', label: 'None' },
    { value: 'Warning (late)', label: 'Warning (late)' },
    { value: 'Academic probation', label: 'Academic probation' },
  ];
  const SCHOLARSHIP_OPTIONS = [
    { value: 'Academic Scholar', label: 'Academic Scholar' },
    { value: "Dean's Lister", label: "Dean's Lister" },
    { value: 'CHED Scholar', label: 'CHED Scholar' },
    { value: 'Athletic Grant', label: 'Athletic Grant' },
    { value: 'Industry Partner', label: 'Industry Partner' },
    { value: 'None', label: 'None' },
  ];

  const fetchStudents = useCallback(async (filters = {}, page = 1, limit = 50) => {
    setIsFetching(true);
    setStudentLoadError('');

    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", limit);
      if (filters.search) params.set("search", filters.search);
      if (filters.program) params.set("program", filters.program);
      if (filters.skill && filters.skill.length > 0) {
        params.set("skill", filters.skill.join(","));
      }
      if (filters.yearLevel) params.set("yearLevel", filters.yearLevel);
      if (filters.section) params.set("section", filters.section);
      if (filters.status) params.set("status", filters.status);
      if (filters.scholarship) params.set("scholarship", filters.scholarship);
      if (filters.gender) params.set("gender", filters.gender);
      if (filters.violation) params.set("violation", filters.violation);

      const url = `/api/students?${params.toString()}`;
      console.log("[fetchStudents] Fetching:", url);

      const data = await apiGetCached(url, { ttlMs: 8000 });
      setStudents(Array.isArray(data.students) ? data.students : []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
    } catch (err) {
      console.error("[fetchStudents] Error:", err);
      setStudentLoadError(
        `Could not load students from the server: ${err.message}. Please ensure the backend is running.`,
      );
      setStudents([]);
    } finally {
      setLoadingStudents(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    fetchStudents({
      search: debouncedQuery,
      program: programFilter,
      skill: skillFilter,
      yearLevel: yearLevelFilter,
      section: sectionFilter,
      status: statusFilter,
      scholarship: scholarshipFilter,
      gender: genderFilter,
      violation: violationFilter,
    }, pagination.page);
  }, [
    debouncedQuery,
    programFilter,
    skillFilter,
    yearLevelFilter,
    sectionFilter,
    statusFilter,
    scholarshipFilter,
    genderFilter,
    violationFilter,
    fetchStudents,
  ]);

  // Reset to page 1 when filters change (but not when pagination changes)
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedQuery,
    programFilter,
    skillFilter,
    yearLevelFilter,
    sectionFilter,
    statusFilter,
    scholarshipFilter,
    genderFilter,
    violationFilter,
  ]);

  const handleClearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setProgramFilter("");
    setSkillFilter([]);
    setYearLevelFilter("");
    setSectionFilter("");
    setStatusFilter("");
    setScholarshipFilter("");
    setGenderFilter("");
    setViolationFilter("");
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (programFilter) count++;
    if (skillFilter.length > 0) count += skillFilter.length;
    if (yearLevelFilter) count++;
    if (sectionFilter) count++;
    if (statusFilter) count++;
    if (scholarshipFilter) count++;
    if (genderFilter) count++;
    if (violationFilter) count++;
    return count;
  }, [
    programFilter,
    skillFilter,
    yearLevelFilter,
    sectionFilter,
    statusFilter,
    scholarshipFilter,
    genderFilter,
    violationFilter,
  ]);

  // Build active filters list for display
  const activeFilters = useMemo(() => {
    const filters = [];
    if (programFilter) {
      const opt = PROGRAM_OPTIONS.find((o) => o.value === programFilter);
      filters.push({
        label: opt ? opt.label : programFilter,
        value: programFilter,
        type: "program",
      });
    }
    skillFilter.forEach((skill) => {
      const opt = SKILL_OPTIONS.find((o) => o.value === skill);
      filters.push({
        label: opt ? opt.label : skill,
        value: skill,
        type: "skill",
      });
    });
    if (yearLevelFilter) {
      const opt = YEAR_LEVEL_OPTIONS.find((o) => o.value === yearLevelFilter);
      filters.push({
        label: opt ? opt.label : yearLevelFilter,
        value: yearLevelFilter,
        type: "yearLevel",
      });
    }
    if (sectionFilter)
      filters.push({
        label: sectionFilter,
        value: sectionFilter,
        type: "section",
      });
    if (statusFilter)
      filters.push({
        label: statusFilter,
        value: statusFilter,
        type: "status",
      });
    if (scholarshipFilter) {
      const opt = SCHOLARSHIP_OPTIONS.find(
        (o) => o.value === scholarshipFilter,
      );
      filters.push({
        label: opt ? opt.label : scholarshipFilter,
        value: scholarshipFilter,
        type: "scholarship",
      });
    }
    if (genderFilter) {
      const opt = GENDER_OPTIONS.find((o) => o.value === genderFilter);
      filters.push({
        label: opt ? opt.label : genderFilter,
        value: genderFilter,
        type: "gender",
      });
    }
    if (violationFilter) {
      const opt = VIOLATION_OPTIONS.find((o) => o.value === violationFilter);
      filters.push({
        label: opt ? opt.label : violationFilter,
        value: violationFilter,
        type: "violation",
      });
    }
    return filters;
  }, [
    programFilter,
    skillFilter,
    yearLevelFilter,
    sectionFilter,
    statusFilter,
    scholarshipFilter,
    genderFilter,
    violationFilter,
  ]);

  const removeActiveFilter = (filter) => {
    switch (filter.type) {
      case "program":
        setProgramFilter("");
        break;
      case "skill":
        setSkillFilter((prev) => prev.filter((s) => s !== filter.value));
        break;
      case "yearLevel":
        setYearLevelFilter("");
        break;
      case "section":
        setSectionFilter("");
        break;
      case "status":
        setStatusFilter("");
        break;
      case "scholarship":
        setScholarshipFilter("");
        break;
      case "gender":
        setGenderFilter("");
        break;
      case "violation":
        setViolationFilter("");
        break;
      default:
        break;
    }
  };

  const nextStudentId = useMemo(() => {
    const prefix = '2201';
    const manualMax = 899;
    const maxSuffix = students
      .map((student) => String(student.id || ''))
      .filter((id) => id.startsWith(prefix) && id.length === 7)
      .map((id) => Number.parseInt(id.slice(prefix.length), 10))
      .filter((value) => Number.isInteger(value) && value <= manualMax)
      .reduce((max, current) => (current > max ? current : max), 0);

    return `${prefix}${String(maxSuffix + 1).padStart(3, '0')}`;
  }, [students]);

  const handleRowClick = (student) => {
    navigate(`/dashboard/student-info/${encodeURIComponent(student.id)}`);
  };

  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedStudent(null);
      return;
    }
    const match = students.find((student) => String(student.id) === String(selectedStudentId));
    setSelectedStudent(match || null);
  }, [selectedStudentId, students]);

  const handleDeleteClick = (student) => {
    setDeleteTarget(student);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?._id) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await apiFetch(`/api/students/${deleteTarget._id}`, { method: 'DELETE' });
      if (res.status === 200 || res.status === 204) {
        invalidateApiCache('/api/students');
        setStudents((prev) => prev.filter((s) => s._id !== deleteTarget._id));
        toast.success("Student record successfully deleted!");
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
        if (selectedStudent?._id === deleteTarget._id) setSelectedStudent(null);
        return;
      }
      const payload = await res.json().catch(() => ({}));
      setDeleteError(payload.message || 'Delete failed.');
    } catch {
      setDeleteError('Network error. Please check your connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentStudentFilters = {
    search: debouncedQuery,
    program: programFilter,
    skill: skillFilter,
    yearLevel: yearLevelFilter,
    section: sectionFilter,
    status: statusFilter,
    scholarship: scholarshipFilter,
    gender: genderFilter,
    violation: violationFilter,
  };

  useEffect(() => {
    setPageInput(String(pagination.page || 1));
  }, [pagination.page]);

  const handleTopPaginationJump = () => {
    const parsed = Number.parseInt(String(pageInput || "").trim(), 10);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(pagination.page || 1));
      return;
    }
    const nextPage = Math.min(Math.max(parsed, 1), Math.max(pagination.totalPages || 1, 1));
    setPageInput(String(nextPage));
    if (nextPage !== pagination.page && !isFetching) {
      fetchStudents(currentStudentFilters, nextPage, pagination.limit);
    }
  };

  return (
    <div className="student-directory">
      {isStudent ? (
        <div className="profile-hero-student">
          <div className="profile-hero-content">
            {/* <div className="profile-hero-icon">
              <FiUser />
            </div> */}
            <div className="profile-hero-text">
              <h2 className="profile-hero-title">Student Profile</h2>
              <p className="profile-hero-subtitle">
                View your personal and academic records.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="directory-hero student-hero">
          <div className="directory-hero-icon">
            <FiUsers />
          </div>
          <div>
            <p className="directory-hero-title">Student Information</p>
            <p className="directory-hero-subtitle">
              <FiInfo />
              <span>View the current student population at a glance. Click any row to see full details.</span>
            </p>
          </div>
        </div>
      )}

      {!isStudent && (
        <div className="table-card">
          {/* ===== Top Toolbar ===== */}
          <div className="table-toolbar">
          <div className="search-box">
            <FiSearch />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by ID, name, program, or section"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="toolbar-meta flex items-center justify-between gap-4">
            <div className="student-count-badge">
              <FiUsers />
              <span>{students.length} students</span>
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
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentFormMode("create");
                  setStudentFormTarget(null);
                  setIsStudentFormOpen(true);
                }}
                className="add-student-btn"
                aria-label="Add a new student"
                disabled={loadingStudents || isFetching}
                title={
                  loadingStudents || isFetching
                    ? "Loading students..."
                    : "Add Student"
                }
              >
                <FiPlus />
                <span>Add student</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* ===== Filter Panel ===== */}
        {showFilters && (
          <>
            <div className="filter-panel">
              <div className="filter-grid">
                <FilterDropdown
                  label="Program"
                  value={programFilter}
                  options={PROGRAM_OPTIONS}
                  onChange={setProgramFilter}
                  onClear={() => setProgramFilter("")}
                  placeholder="All programs"
                  disabled={isFetching}
                />
                <FilterDropdown
                  label="Year Level"
                  value={yearLevelFilter}
                  options={YEAR_LEVEL_OPTIONS}
                  onChange={setYearLevelFilter}
                  onClear={() => setYearLevelFilter("")}
                  placeholder="All years"
                  disabled={isFetching}
                />
                <FilterDropdown
                  label="Section"
                  value={sectionFilter}
                  options={SECTION_OPTIONS}
                  onChange={setSectionFilter}
                  onClear={() => setSectionFilter("")}
                  placeholder="All sections"
                  disabled={isFetching}
                  customInput={true}
                />
                <FilterDropdown
                  label="Status"
                  value={statusFilter}
                  options={STATUS_OPTIONS}
                  onChange={setStatusFilter}
                  onClear={() => setStatusFilter("")}
                  placeholder="Active"
                  disabled={isFetching}
                />
                <FilterDropdown
                  label="Scholarship"
                  value={scholarshipFilter}
                  options={SCHOLARSHIP_OPTIONS}
                  onChange={setScholarshipFilter}
                  onClear={() => setScholarshipFilter("")}
                  placeholder="All scholarships"
                  disabled={isFetching}
                />
                <FilterDropdown
                  label="Gender"
                  value={genderFilter}
                  options={GENDER_OPTIONS}
                  onChange={setGenderFilter}
                  onClear={() => setGenderFilter("")}
                  placeholder="All genders"
                  disabled={isFetching}
                />
                <FilterDropdown
                  label="Violation"
                  value={violationFilter}
                  options={VIOLATION_OPTIONS}
                  onChange={setViolationFilter}
                  onClear={() => setViolationFilter("")}
                  placeholder="All violations"
                  disabled={isFetching}
                />
                <SkillsFilter
                  label="Skills"
                  value={skillFilter}
                  options={SKILL_OPTIONS}
                  onChange={setSkillFilter}
                  disabled={isFetching}
                />
              </div>
            </div>

            {/* ===== Active Filters Strip ===== */}
            {activeFilters.length > 0 && (
              <div className="active-filters-strip">
                <span className="active-filters-label">Active filters:</span>
                <div className="active-filters-list">
                  {activeFilters.map((filter) => (
                    <span
                      key={`${filter.type}-${filter.value}`}
                      className="active-filter-chip">
                      {filter.label}
                      <button
                        type="button"
                        className="active-filter-chip-remove"
                        onClick={() => removeActiveFilter(filter)}
                        aria-label={`Remove ${filter.label} filter`}>
                        <FiX />
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="clear-all-btn"
                  onClick={handleClearFilters}
                  disabled={isFetching}>
                  Clear all
                </button>
              </div>
            )}
          </>
        )}

        {/* ===== Results Count ===== */}
        <div className="results-count">
          <div className="results-count-text">
            Showing <strong>{students.length}</strong> student
            {students.length !== 1 ? "s" : ""}
            {activeFilterCount > 0 ? ` of ${students.length} filtered` : ""}
          </div>
          {pagination.totalPages > 1 ? (
            <div className="results-count-pagination" aria-label="Top pagination controls">
              <button
                className="pagination-btn pagination-btn-sm"
                onClick={() => fetchStudents(currentStudentFilters, pagination.page - 1, pagination.limit)}
                disabled={!pagination.hasPrev || isFetching}
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
                  max={pagination.totalPages}
                  inputMode="numeric"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={handleTopPaginationJump}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleTopPaginationJump();
                    }
                  }}
                  className="pagination-page-input"
                  disabled={isFetching}
                />
              </label>
              <span className="pagination-info pagination-info-sm">of {pagination.totalPages}</span>
              <button
                className="pagination-btn pagination-btn-sm"
                onClick={() => fetchStudents(currentStudentFilters, pagination.page + 1, pagination.limit)}
                disabled={!pagination.hasNext || isFetching}
                type="button"
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
          ) : null}
        </div>

        {studentLoadError ? (
          <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {studentLoadError}
          </div>
        ) : null}
        {successMessage ? (
          <div className="page-success-alert">
            {successMessage}
          </div>
        ) : null}

        <div className="table-responsive">
          <table className="student-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Gender</th>
                <th>Program</th>
                <th>Year Level</th>
                <th>Enrollment Status</th>
                <th>Violation</th>
                <th>Skills</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  onClick={() => handleRowClick(student)}
                  className={String(selectedStudentId || '') === String(student.id || '') ? 'row-selected' : ''}
                >
                  <td className="id-cell">
                    <span className="id-badge">{student.id}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <FiUser />
                      <span>{student.firstName}</span>
                    </div>
                  </td>
                  <td>{student.lastName}</td>
                  <td>{student.gender}</td>
                  <td>{student.program}</td>
                  <td>{student.yearLevel}</td>
                  <td>
                    <span className={`status-badge status-${student.status.replace(' ', '').toLowerCase()}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>{student.violation}</td>
                  <td className="skills-cell">
                    {student.skills && student.skills.length > 0 ? (
                      <div className="skills-list">
                        {student.skills.map((skill, idx) => (
                          <span key={idx} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="skills-empty">No skills listed</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="action-btn view"
                        type="button"
                        aria-label="View student profile"
                        title="View student profile"
                        onClick={() => navigate(`/dashboard/student-info/${encodeURIComponent(student.id)}`)}
                      >
                        <FiEye />
                      </button>
                      {isAdmin ? (
                        <>
                          <button
                            className="action-btn edit"
                            type="button"
                            disabled={!student._id}
                            aria-label="Edit student"
                            title={student._id ? 'Edit student' : 'Editing unavailable for sample data'}
                            onClick={() => {
                              setStudentFormMode('edit');
                              setStudentFormTarget(student);
                              setIsStudentFormOpen(true);
                              setSelectedStudent(null);
                            }}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="action-btn delete"
                            type="button"
                            disabled={!student._id}
                            aria-label="Delete student"
                            title={student._id ? 'Delete student' : 'Deleting unavailable for sample data'}
                            onClick={() => handleDeleteClick(student)}
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!students.length && (
                <tr>
                  <td colSpan="10" className="empty-row">
                    {isFetching
                      ? "Loading students..."
                      : query ||
                          programFilter ||
                          (skillFilter && skillFilter.length > 0) ||
                          yearLevelFilter ||
                          sectionFilter ||
                          statusFilter ||
                          scholarshipFilter ||
                          genderFilter ||
                          violationFilter
                        ? `No students found matching your filters.`
                        : "No students available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="pagination-controls">
            <div className="results-count-pagination" aria-label="Bottom pagination controls">
              <button
                className="pagination-btn pagination-btn-sm"
                onClick={() => fetchStudents(currentStudentFilters, pagination.page - 1, pagination.limit)}
                disabled={!pagination.hasPrev || isFetching}
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
                  max={pagination.totalPages}
                  inputMode="numeric"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={handleTopPaginationJump}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleTopPaginationJump();
                    }
                  }}
                  className="pagination-page-input"
                  disabled={isFetching}
                />
              </label>
              <span className="pagination-info pagination-info-sm">of {pagination.totalPages}</span>
              <button
                className="pagination-btn pagination-btn-sm"
                onClick={() => fetchStudents(currentStudentFilters, pagination.page + 1, pagination.limit)}
                disabled={!pagination.hasNext || isFetching}
                type="button"
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
        </div>
      )}

      {selectedStudent && (
        <div className={isStudent ? "student-full-page" : "student-modal-backdrop"} onClick={() => !isStudent && navigate('/dashboard/student-info')}>
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            {!isStudent && (
              <div className="breadcrumb-bar">
                <button className="breadcrumb-link" type="button" onClick={() => navigate('/dashboard/student-info')}>
                  Student Information
                </button>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </span>
              </div>
            )}
            <div className="modal-header">
              <div className="profile-header">
                <img
                  className="profile-avatar"
                  src={getStudentAvatar(selectedStudent)}
                  alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                />
                <div>
                  <p className="modal-eyebrow">Student Details</p>
                  <h3>
                    {selectedStudent.firstName} {selectedStudent.middleName} {selectedStudent.lastName}
                  </h3>
                  <p className="modal-subtitle">ID: {selectedStudent.id}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStudentFormMode('edit');
                      setStudentFormTarget(selectedStudent);
                      setIsStudentFormOpen(true);
                      setSelectedStudent(null);
                    }}
                    disabled={!selectedStudent?._id}
                    className="modal-edit-btn"
                    title={selectedStudent?._id ? 'Edit student' : 'Editing unavailable for sample data'}
                  >
                    <FiEdit2 />
                    <span>Edit</span>
                  </button>
                ) : null}
                {!isStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteClick(selectedStudent);
                      setSelectedStudent(null);
                    }}
                    disabled={!selectedStudent?._id}
                    className="modal-edit-btn modal-delete-btn"
                    title={
                      selectedStudent?._id
                        ? "Delete student"
                        : "Deleting unavailable for sample data"
                    }>
                    <FiTrash2 />
                    <span>Delete</span>
                  </button>
                )}
                {!isStudent && (
                  <button
                    className="modal-close"
                    onClick={() => navigate('/dashboard/student-info')}
                    aria-label="Close dialog"
                    type="button"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            </div>

            <div className="profile-details-container">
              <StudentProfileTabs student={selectedStudent} />
            </div>
          </div>
        </div>
      )}

      {isStudentFormOpen ? (
        <AddStudentForm
          mode={studentFormMode}
          initialData={studentFormTarget}
          nextStudentId={nextStudentId}
          targetMongoId={studentFormTarget?._id}
          onClose={() => setIsStudentFormOpen(false)}
          onCreated={(createdStudent) => {
            invalidateApiCache('/api/students');
            setStudents((prev) => [createdStudent, ...prev]);
            setQuery('');
            setSelectedStudent(createdStudent);
            setSuccessMessage('Student profile created successfully.');
          }}
          onUpdated={(updatedStudent) => {
            invalidateApiCache('/api/students');
            setStudents((prev) =>
              prev.map((s) => (s._id && updatedStudent._id && s._id === updatedStudent._id ? updatedStudent : s)),
            );
            setSelectedStudent(updatedStudent);
            setSuccessMessage('Student profile updated successfully.');
          }}
        />
      ) : null}
      {isDeleteModalOpen && deleteTarget ? (
        <DeleteConfirmationModal
          studentName={`${deleteTarget.firstName} ${deleteTarget.lastName}`}
          studentId={deleteTarget.id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
            setDeleteError('');
          }}
          isDeleting={isDeleting}
          error={deleteError}
        />
      ) : null}
    </div>
  );
};

export default StudentInformation;
