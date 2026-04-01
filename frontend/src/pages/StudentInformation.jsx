import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiRotateCcw,
  FiFilter,
} from "react-icons/fi";
import femaleImage from "../assets/images/female.jpg";
import maleImage from "../assets/images/male.jpg";
import AddStudentForm from "../components/AddStudentForm";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import FilterDropdown from "../components/FilterDropdown";
import "../styles/StudentInformation.css";

const mockStudents = [
  {
    id: "2023-001",
    firstName: "Althea",
    middleName: "M.",
    lastName: "Santos",
    gender: "Female",
    dob: "2005-02-18",
    program: "BSCS",
    yearLevel: "2",
    section: "CS2A",
    status: "Enrolled",
    scholarship: "Academic Scholar",
    email: "althea.santos@ccs.edu",
    contact: "+63 917 555 1001",
    dateEnrolled: "2023-08-21",
    guardian: "Maria Santos",
    guardianContact: "+63 917 777 8800",
    violation: "None",
  },
  {
    id: "2023-002",
    firstName: "Bryan",
    middleName: "L.",
    lastName: "Reyes",
    gender: "Male",
    dob: "2004-11-05",
    program: "BSIT",
    yearLevel: "3",
    section: "IT3B",
    status: "Enrolled",
    scholarship: "Dean's Lister",
    email: "bryan.reyes@ccs.edu",
    contact: "+63 917 555 1002",
    dateEnrolled: "2022-08-22",
    guardian: "Leo Reyes",
    guardianContact: "+63 917 555 9988",
    violation: "None",
  },
  {
    id: "2023-003",
    firstName: "Claire",
    middleName: "D.",
    lastName: "Valdez",
    gender: "Female",
    dob: "2005-07-12",
    program: "BSCS",
    yearLevel: "1",
    section: "CS1C",
    status: "Enrolled",
    scholarship: "None",
    email: "claire.valdez@ccs.edu",
    contact: "+63 917 555 1003",
    dateEnrolled: "2024-08-23",
    guardian: "Diana Valdez",
    guardianContact: "+63 917 555 8833",
    violation: "None",
  },
  {
    id: "2023-004",
    firstName: "Dylan",
    middleName: "R.",
    lastName: "Lopez",
    gender: "Male",
    dob: "2003-03-30",
    program: "BSEMC",
    yearLevel: "4",
    section: "EM4A",
    status: "On Leave",
    scholarship: "Athletic Grant",
    email: "dylan.lopez@ccs.edu",
    contact: "+63 917 555 1004",
    dateEnrolled: "2021-08-20",
    guardian: "Rosa Lopez",
    guardianContact: "+63 917 555 4411",
    violation: "None",
  },
  {
    id: "2023-005",
    firstName: "Elaine",
    middleName: "C.",
    lastName: "Tan",
    gender: "Female",
    dob: "2004-01-15",
    program: "BSIT",
    yearLevel: "3",
    section: "IT3A",
    status: "Enrolled",
    scholarship: "CHED Scholar",
    email: "elaine.tan@ccs.edu",
    contact: "+63 917 555 1005",
    dateEnrolled: "2022-08-22",
    guardian: "Carlos Tan",
    guardianContact: "+63 917 555 2288",
    violation: "Warning (late)",
  },
  {
    id: "2023-006",
    firstName: "Franco",
    middleName: "N.",
    lastName: "Garcia",
    gender: "Male",
    dob: "2003-09-08",
    program: "BSCS",
    yearLevel: "4",
    section: "CS4B",
    status: "Enrolled",
    scholarship: "None",
    email: "franco.garcia@ccs.edu",
    contact: "+63 917 555 1006",
    dateEnrolled: "2021-08-20",
    guardian: "Norma Garcia",
    guardianContact: "+63 917 555 6699",
    violation: "Academic probation",
  },
  {
    id: "2023-007",
    firstName: "Giselle",
    middleName: "P.",
    lastName: "Chua",
    gender: "Female",
    dob: "2005-04-27",
    program: "BSIS",
    yearLevel: "2",
    section: "IS2A",
    status: "Enrolled",
    scholarship: "Academic Scholar",
    email: "giselle.chua@ccs.edu",
    contact: "+63 917 555 1007",
    dateEnrolled: "2023-08-21",
    guardian: "Patricia Chua",
    guardianContact: "+63 917 555 4477",
    violation: "None",
  },
  {
    id: "2023-008",
    firstName: "Hans",
    middleName: "E.",
    lastName: "Uy",
    gender: "Male",
    dob: "2004-06-02",
    program: "BSIT",
    yearLevel: "3",
    section: "IT3C",
    status: "Enrolled",
    scholarship: "Industry Partner",
    email: "hans.uy@ccs.edu",
    contact: "+63 917 555 1008",
    dateEnrolled: "2022-08-22",
    guardian: "Erica Uy",
    guardianContact: "+63 917 555 6622",
    violation: "None",
  },
  {
    id: "2023-009",
    firstName: "Isabel",
    middleName: "V.",
    lastName: "Cruz",
    gender: "Female",
    dob: "2005-12-10",
    program: "BSIS",
    yearLevel: "2",
    section: "IS2B",
    status: "Enrolled",
    scholarship: "None",
    email: "isabel.cruz@ccs.edu",
    contact: "+63 917 555 1009",
    dateEnrolled: "2023-08-21",
    guardian: "Vicente Cruz",
    guardianContact: "+63 917 555 5577",
    violation: "None",
  },
  {
    id: "2023-010",
    firstName: "Javier",
    middleName: "S.",
    lastName: "Delos Reyes",
    gender: "Male",
    dob: "2003-10-19",
    program: "BSEMC",
    yearLevel: "4",
    section: "EM4B",
    status: "Graduating",
    scholarship: "None",
    email: "javier.delosreyes@ccs.edu",
    contact: "+63 917 555 1010",
    dateEnrolled: "2021-08-20",
    guardian: "Sara Delos Reyes",
    guardianContact: "+63 917 555 3344",
    violation: "None",
  },
];

const StudentInformation = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState(mockStudents);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentLoadError, setStudentLoadError] = useState("");
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [studentFormMode, setStudentFormMode] = useState("create");
  const [studentFormTarget, setStudentFormTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [yearLevelFilter, setYearLevelFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [scholarshipFilter, setScholarshipFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [violationFilter, setViolationFilter] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const searchInputRef = useRef(null);

  const PROGRAM_OPTIONS = [
    { value: "BSCS", label: "BS Computer Science" },
    { value: "BSIT", label: "BS Information Technology" },
    { value: "BSIS", label: "BS Information Systems" },
    { value: "BSEMC", label: "BS Entrepreneurship & Management" },
  ];

  const SKILL_OPTIONS = [
    { value: "Programming", label: "Programming" },
    { value: "Web Development", label: "Web Development" },
    { value: "Database Management", label: "Database Management" },
    { value: "UI/UX Design", label: "UI/UX Design" },
    { value: "Data Analysis", label: "Data Analysis" },
    { value: "Communication", label: "Communication" },
    { value: "Leadership", label: "Leadership" },
    { value: "Problem Solving", label: "Problem Solving" },
  ];

  const YEAR_LEVEL_OPTIONS = [
    { value: "1", label: "Year 1" },
    { value: "2", label: "Year 2" },
    { value: "3", label: "Year 3" },
    { value: "4", label: "Year 4" },
  ];

  const STATUS_OPTIONS = [
    { value: "Enrolled", label: "Enrolled" },
    { value: "On Leave", label: "On Leave" },
    { value: "Graduating", label: "Graduating" },
  ];

  const GENDER_OPTIONS = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ];

  const VIOLATION_OPTIONS = [
    { value: "None", label: "None" },
    { value: "Warning (late)", label: "Warning (late)" },
    { value: "Academic probation", label: "Academic probation" },
  ];

  const SCHOLARSHIP_OPTIONS = [
    { value: "Academic Scholar", label: "Academic Scholar" },
    { value: "Dean's Lister", label: "Dean's Lister" },
    { value: "CHED Scholar", label: "CHED Scholar" },
    { value: "Athletic Grant", label: "Athletic Grant" },
    { value: "Industry Partner", label: "Industry Partner" },
    { value: "None", label: "None" },
  ];

  const getProfileImage = (gender) => {
    const normalized = (gender || "").trim().toLowerCase();
    if (normalized === "male") return maleImage;
    if (normalized === "female") return femaleImage;
    return femaleImage;
  };

  const fetchStudents = useCallback(async (filters = {}) => {
    setIsFetching(true);
    setStudentLoadError("");

    try {
      const params = new URLSearchParams();

      if (filters.search) params.set("search", filters.search);
      if (filters.program) params.set("program", filters.program);
      if (filters.skill) params.set("skill", filters.skill);
      if (filters.yearLevel) params.set("yearLevel", filters.yearLevel);
      if (filters.section) params.set("section", filters.section);
      if (filters.status) params.set("status", filters.status);
      if (filters.scholarship) params.set("scholarship", filters.scholarship);
      if (filters.gender) params.set("gender", filters.gender);
      if (filters.violation) params.set("violation", filters.violation);

      const queryString = params.toString();
      const url = `/api/students${queryString ? `?${queryString}` : ""}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();

      setStudents(Array.isArray(data) ? data : []);
    } catch {
      setStudentLoadError(
        "Could not load students from the server. Showing sample data.",
      );
      setStudents(mockStudents);
    } finally {
      setIsFetching(false);
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents({});
  }, [fetchStudents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);

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
    });
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

  const handleClearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setProgramFilter("");
    setSkillFilter("");
    setYearLevelFilter("");
    setSectionFilter("");
    setStatusFilter("");
    setScholarshipFilter("");
    setGenderFilter("");
    setViolationFilter("");
  };

  const nextStudentId = useMemo(() => {
    const prefix = "2201";
    const manualMax = 899;
    const maxSuffix = students
      .map((student) => String(student.id || ""))
      .filter((id) => id.startsWith(prefix) && id.length === 7)
      .map((id) => Number.parseInt(id.slice(prefix.length), 10))
      .filter((value) => Number.isInteger(value) && value <= manualMax)
      .reduce((max, current) => (current > max ? current : max), 0);

    return `${prefix}${String(maxSuffix + 1).padStart(3, "0")}`;
  }, [students]);

  const handleRowClick = (student) => {
    setSelectedStudent(student);
  };

  const handleDeleteClick = (student) => {
    setDeleteTarget(student);
    setDeleteError("");
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?._id) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/students/${deleteTarget._id}`, {
        method: "DELETE",
      });

      if (res.status === 200 || res.status === 204) {
        setStudents((prev) => prev.filter((s) => s._id !== deleteTarget._id));
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
      } else if (res.status === 404) {
        setDeleteError(
          "Student record not found. It may have been deleted already.",
        );
      } else {
        const errorData = await res.json().catch(() => ({}));
        setDeleteError(
          errorData.message || `Request failed with status ${res.status}`,
        );
      }
    } catch (err) {
      setDeleteError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    setDeleteError("");
  };

  return (
    <div className="student-directory">
      <div className="page-header">
        <h2>Student Information</h2>
        <p className="subtitle">
          View the current student population at a glance. Click any row to see
          full details.
        </p>
      </div>

      <div className="table-card">
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
            <span className="meta-chip">{students.length} students</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
                onClick={() => setShowFilters(!showFilters)}
                title="Toggle advanced filters">
                <FiFilter />
                <span>Filters</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentFormMode("create");
                  setStudentFormTarget(null);
                  setIsStudentFormOpen(true);
                }}
                className="inline-flex min-h-[44px] min-w-[160px] items-center justify-center whitespace-nowrap rounded-xl bg-[#ff7f00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e67300] focus:outline-none focus:ring-2 focus:ring-[#fff3e6]"
                aria-label="Add a new student"
                disabled={loadingStudents || isFetching}
                title={
                  loadingStudents || isFetching
                    ? "Loading students..."
                    : "Add Student"
                }>
                <FiPlus />
                <span>Add Student</span>
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="filter-toolbar">
            <div className="filter-group">
              <FilterDropdown
                label="Program"
                value={programFilter}
                options={PROGRAM_OPTIONS}
                onChange={setProgramFilter}
                onClear={() => setProgramFilter("")}
                placeholder="All Programs"
                disabled={isFetching}
              />
              <FilterDropdown
                label="Year Level"
                value={yearLevelFilter}
                options={YEAR_LEVEL_OPTIONS}
                onChange={setYearLevelFilter}
                onClear={() => setYearLevelFilter("")}
                placeholder="All Years"
                disabled={isFetching}
              />
              <FilterDropdown
                label="Section"
                value={sectionFilter}
                options={[]}
                onChange={setSectionFilter}
                onClear={() => setSectionFilter("")}
                placeholder="All Sections"
                disabled={isFetching}
                customInput={true}
              />
              <FilterDropdown
                label="Status"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={setStatusFilter}
                onClear={() => setStatusFilter("")}
                placeholder="All Statuses"
                disabled={isFetching}
              />
              <FilterDropdown
                label="Scholarship"
                value={scholarshipFilter}
                options={SCHOLARSHIP_OPTIONS}
                onChange={setScholarshipFilter}
                onClear={() => setScholarshipFilter("")}
                placeholder="All Scholarships"
                disabled={isFetching}
              />
              <FilterDropdown
                label="Gender"
                value={genderFilter}
                options={GENDER_OPTIONS}
                onChange={setGenderFilter}
                onClear={() => setGenderFilter("")}
                placeholder="All Genders"
                disabled={isFetching}
              />
              <FilterDropdown
                label="Skills"
                value={skillFilter}
                options={SKILL_OPTIONS}
                onChange={setSkillFilter}
                onClear={() => setSkillFilter("")}
                placeholder="All Skills"
                disabled={isFetching}
              />
              <FilterDropdown
                label="Violation"
                value={violationFilter}
                options={VIOLATION_OPTIONS}
                onChange={setViolationFilter}
                onClear={() => setViolationFilter("")}
                placeholder="All Violations"
                disabled={isFetching}
              />
            </div>
            {(programFilter ||
              skillFilter ||
              yearLevelFilter ||
              sectionFilter ||
              statusFilter ||
              scholarshipFilter ||
              genderFilter ||
              violationFilter ||
              query) && (
              <button
                type="button"
                className="clear-filters-btn"
                onClick={handleClearFilters}
                disabled={isFetching}>
                <FiRotateCcw />
                Clear Filters
              </button>
            )}
          </div>
        )}

        {studentLoadError ? (
          <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {studentLoadError}
          </div>
        ) : null}

        <div className="table-responsive">
          <table className="student-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>First Name</th>
                <th>Middle Name</th>
                <th>Last Name</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Program/Course</th>
                <th>Year Level</th>
                <th>Section</th>
                <th>Enrollment Status</th>
                <th>Scholarship</th>
                <th>Email Address</th>
                <th>Contact Number</th>
                <th>Date Enrolled</th>
                <th>Guardian</th>
                <th>Guardian Contact Information</th>
                <th>Violation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} onClick={() => handleRowClick(student)}>
                  <td className="id-cell">
                    <span className="id-badge">{student.id}</span>
                  </td>
                  <td>{student.firstName}</td>
                  <td>{student.middleName}</td>
                  <td>{student.lastName}</td>
                  <td>{student.gender}</td>
                  <td>{student.dob}</td>
                  <td>{student.program}</td>
                  <td>{student.yearLevel}</td>
                  <td>{student.section}</td>
                  <td>
                    <span
                      className={`status-badge status-${student.status.replace(" ", "").toLowerCase()}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>{student.scholarship}</td>
                  <td>{student.email}</td>
                  <td>{student.contact}</td>
                  <td>{student.dateEnrolled}</td>
                  <td>{student.guardian}</td>
                  <td>{student.guardianContact}</td>
                  <td>{student.violation}</td>
                  <td>
                    <div
                      className="action-buttons"
                      onClick={(e) => e.stopPropagation()}>
                      <button
                        className="action-btn edit"
                        type="button"
                        disabled={!student._id}
                        aria-label="Edit student"
                        title={
                          student._id
                            ? "Edit student"
                            : "Editing unavailable for sample data"
                        }
                        onClick={() => {
                          setStudentFormMode("edit");
                          setStudentFormTarget(student);
                          setIsStudentFormOpen(true);
                          setSelectedStudent(null);
                        }}>
                        <FiEdit2 />
                      </button>
                      <button
                        className="action-btn delete"
                        type="button"
                        disabled={!student._id}
                        aria-label="Delete student"
                        title={
                          student._id
                            ? "Delete student"
                            : "Deleting unavailable for sample data"
                        }
                        onClick={() => handleDeleteClick(student)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!students.length && (
                <tr>
                  <td colSpan="18" className="empty-row">
                    {isFetching
                      ? "Loading students..."
                      : query ||
                          programFilter ||
                          skillFilter ||
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
      </div>

      {selectedStudent && (
        <div
          className="student-modal-backdrop"
          onClick={() => setSelectedStudent(null)}>
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            <div className="breadcrumb-bar">
              <button
                className="breadcrumb-link"
                type="button"
                onClick={() => setSelectedStudent(null)}>
                Students
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </span>
            </div>
            <div className="modal-header">
              <div className="profile-header">
                <img
                  className="profile-avatar"
                  src={getProfileImage(selectedStudent.gender)}
                  alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                />
                <div>
                  <p className="modal-eyebrow">Student Details</p>
                  <h3>
                    {selectedStudent.firstName} {selectedStudent.middleName}{" "}
                    {selectedStudent.lastName}
                  </h3>
                  <p className="modal-subtitle">ID: {selectedStudent.id}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStudentFormMode("edit");
                    setStudentFormTarget(selectedStudent);
                    setIsStudentFormOpen(true);
                    setSelectedStudent(null);
                  }}
                  disabled={!selectedStudent?._id}
                  className="modal-edit-btn"
                  title={
                    selectedStudent?._id
                      ? "Edit student"
                      : "Editing unavailable for sample data"
                  }>
                  <FiEdit2 />
                  <span>Edit</span>
                </button>
                <button
                  className="modal-close"
                  onClick={() => setSelectedStudent(null)}
                  aria-label="Close dialog"
                  type="button">
                  <FiX />
                </button>
              </div>
            </div>

            <div className="modal-grid">
              <div>
                <p className="label">Program / Course</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.program}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Year Level</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.yearLevel}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Section</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.section}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Enrollment Status</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.status}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Scholarship</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.scholarship}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Date Enrolled</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.dateEnrolled}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Date of Birth</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.dob}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Gender</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.gender}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Contact Number</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.contact}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Email Address</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.email}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Guardian</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.guardian}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Guardian Contact Info</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.guardianContact}
                  readOnly
                />
              </div>
              <div>
                <p className="label">Violation</p>
                <input
                  className="readonly-field"
                  type="text"
                  value={selectedStudent.violation}
                  readOnly
                />
              </div>
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
            setStudents((prev) => [createdStudent, ...prev]);
            setQuery("");
            setSelectedStudent(createdStudent);
          }}
          onUpdated={(updatedStudent) => {
            setStudents((prev) =>
              prev.map((s) =>
                s._id && updatedStudent._id && s._id === updatedStudent._id
                  ? updatedStudent
                  : s,
              ),
            );
            setSelectedStudent(updatedStudent);
          }}
        />
      ) : null}

      {isDeleteModalOpen && deleteTarget ? (
        <DeleteConfirmationModal
          studentName={`${deleteTarget.firstName} ${deleteTarget.lastName}`}
          studentId={deleteTarget.id}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={isDeleting}
          error={deleteError}
        />
      ) : null}
    </div>
  );
};

export default StudentInformation;
