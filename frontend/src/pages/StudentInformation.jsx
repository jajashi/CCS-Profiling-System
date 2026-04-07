import React, { useEffect, useMemo, useState } from 'react';
import { FiInfo, FiMail, FiPhone, FiPlus, FiSearch, FiEdit2, FiTrash2, FiUser, FiUsers, FiX } from 'react-icons/fi';
import femaleImage from '../assets/images/female.jpg';
import maleImage from '../assets/images/male.jpg';
import AddStudentForm from '../components/AddStudentForm';
import '../styles/StudentInformation.css';

const mockStudents = [
  {
    id: '2023-001',
    firstName: 'Althea',
    middleName: 'M.',
    lastName: 'Santos',
    gender: 'Female',
    dob: '2005-02-18',
    program: 'BSCS',
    yearLevel: '2',
    section: 'CS2A',
    status: 'Enrolled',
    scholarship: 'Academic Scholar',
    email: 'althea.santos@ccs.edu',
    contact: '+63 917 555 1001',
    dateEnrolled: '2023-08-21',
    guardian: 'Maria Santos',
    guardianContact: '+63 917 777 8800',
    violation: 'None',
  },
  {
    id: '2023-002',
    firstName: 'Bryan',
    middleName: 'L.',
    lastName: 'Reyes',
    gender: 'Male',
    dob: '2004-11-05',
    program: 'BSIT',
    yearLevel: '3',
    section: 'IT3B',
    status: 'Enrolled',
    scholarship: "Dean's Lister",
    email: 'bryan.reyes@ccs.edu',
    contact: '+63 917 555 1002',
    dateEnrolled: '2022-08-22',
    guardian: 'Leo Reyes',
    guardianContact: '+63 917 555 9988',
    violation: 'None',
  },
  {
    id: '2023-003',
    firstName: 'Claire',
    middleName: 'D.',
    lastName: 'Valdez',
    gender: 'Female',
    dob: '2005-07-12',
    program: 'BSCS',
    yearLevel: '1',
    section: 'CS1C',
    status: 'Enrolled',
    scholarship: 'None',
    email: 'claire.valdez@ccs.edu',
    contact: '+63 917 555 1003',
    dateEnrolled: '2024-08-23',
    guardian: 'Diana Valdez',
    guardianContact: '+63 917 555 8833',
    violation: 'None',
  },
  {
    id: '2023-004',
    firstName: 'Dylan',
    middleName: 'R.',
    lastName: 'Lopez',
    gender: 'Male',
    dob: '2003-03-30',
    program: 'BSEMC',
    yearLevel: '4',
    section: 'EM4A',
    status: 'On Leave',
    scholarship: 'Athletic Grant',
    email: 'dylan.lopez@ccs.edu',
    contact: '+63 917 555 1004',
    dateEnrolled: '2021-08-20',
    guardian: 'Rosa Lopez',
    guardianContact: '+63 917 555 4411',
    violation: 'None',
  },
  {
    id: '2023-005',
    firstName: 'Elaine',
    middleName: 'C.',
    lastName: 'Tan',
    gender: 'Female',
    dob: '2004-01-15',
    program: 'BSIT',
    yearLevel: '3',
    section: 'IT3A',
    status: 'Enrolled',
    scholarship: 'CHED Scholar',
    email: 'elaine.tan@ccs.edu',
    contact: '+63 917 555 1005',
    dateEnrolled: '2022-08-22',
    guardian: 'Carlos Tan',
    guardianContact: '+63 917 555 2288',
    violation: 'Warning (late)',
  },
  {
    id: '2023-006',
    firstName: 'Franco',
    middleName: 'N.',
    lastName: 'Garcia',
    gender: 'Male',
    dob: '2003-09-08',
    program: 'BSCS',
    yearLevel: '4',
    section: 'CS4B',
    status: 'Enrolled',
    scholarship: 'None',
    email: 'franco.garcia@ccs.edu',
    contact: '+63 917 555 1006',
    dateEnrolled: '2021-08-20',
    guardian: 'Norma Garcia',
    guardianContact: '+63 917 555 6699',
    violation: 'Academic probation',
  },
  {
    id: '2023-007',
    firstName: 'Giselle',
    middleName: 'P.',
    lastName: 'Chua',
    gender: 'Female',
    dob: '2005-04-27',
    program: 'BSIS',
    yearLevel: '2',
    section: 'IS2A',
    status: 'Enrolled',
    scholarship: 'Academic Scholar',
    email: 'giselle.chua@ccs.edu',
    contact: '+63 917 555 1007',
    dateEnrolled: '2023-08-21',
    guardian: 'Patricia Chua',
    guardianContact: '+63 917 555 4477',
    violation: 'None',
  },
  {
    id: '2023-008',
    firstName: 'Hans',
    middleName: 'E.',
    lastName: 'Uy',
    gender: 'Male',
    dob: '2004-06-02',
    program: 'BSIT',
    yearLevel: '3',
    section: 'IT3C',
    status: 'Enrolled',
    scholarship: 'Industry Partner',
    email: 'hans.uy@ccs.edu',
    contact: '+63 917 555 1008',
    dateEnrolled: '2022-08-22',
    guardian: 'Erica Uy',
    guardianContact: '+63 917 555 6622',
    violation: 'None',
  },
  {
    id: '2023-009',
    firstName: 'Isabel',
    middleName: 'V.',
    lastName: 'Cruz',
    gender: 'Female',
    dob: '2005-12-10',
    program: 'BSIS',
    yearLevel: '2',
    section: 'IS2B',
    status: 'Enrolled',
    scholarship: 'None',
    email: 'isabel.cruz@ccs.edu',
    contact: '+63 917 555 1009',
    dateEnrolled: '2023-08-21',
    guardian: 'Vicente Cruz',
    guardianContact: '+63 917 555 5577',
    violation: 'None',
  },
  {
    id: '2023-010',
    firstName: 'Javier',
    middleName: 'S.',
    lastName: 'Delos Reyes',
    gender: 'Male',
    dob: '2003-10-19',
    program: 'BSEMC',
    yearLevel: '4',
    section: 'EM4B',
    status: 'Graduating',
    scholarship: 'None',
    email: 'javier.delosreyes@ccs.edu',
    contact: '+63 917 555 1010',
    dateEnrolled: '2021-08-20',
    guardian: 'Sara Delos Reyes',
    guardianContact: '+63 917 555 3344',
    violation: 'None',
  },
];

const StudentInformation = () => {
  const [query, setQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState(mockStudents);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentLoadError, setStudentLoadError] = useState('');
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [studentFormMode, setStudentFormMode] = useState('create');
  const [studentFormTarget, setStudentFormTarget] = useState(null);

  const getStudentAvatar = (student) => {
    if (student?.profileAvatar) return student.profileAvatar;
    const normalized = (student?.gender || '').trim().toLowerCase();
    if (normalized === 'male') return maleImage;
    if (normalized === 'female') return femaleImage;
    return femaleImage;
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await fetch('/api/students');
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setStudents(data);
        }
      } catch {
        if (isMounted) {
          setStudentLoadError('Could not load students from the server. Showing sample data.');
        }
      } finally {
        if (isMounted) setLoadingStudents(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return students;
    return students.filter((student) =>
      [
        student.id,
        student.firstName,
        student.middleName,
        student.lastName,
        student.program,
        student.section,
        student.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [query, students]);

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
    setSelectedStudent(student);
  };

  return (
    <div className="student-directory">
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

      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by ID, name, program, or section"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="toolbar-meta flex items-center justify-between gap-4">
            <span className="meta-chip">
              {filteredStudents.length} of {students.length} students
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedStudent(null);
                setStudentFormMode('create');
                setStudentFormTarget(null);
                setIsStudentFormOpen(true);
              }}
              className="inline-flex min-h-[44px] min-w-[160px] items-center justify-center whitespace-nowrap rounded-xl bg-[#ff7f00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e67300] focus:outline-none focus:ring-2 focus:ring-[#fff3e6]"
              aria-label="Add a new student"
              disabled={loadingStudents}
              title={loadingStudents ? 'Loading students...' : 'Add Student'}
            >
              <FiPlus />
              <span>Add Student</span>
            </button>
          </div>
        </div>

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
              {filteredStudents.map((student) => (
                <tr key={student.id} onClick={() => handleRowClick(student)}>
                  <td className="id-cell">
                    <span className="id-badge">{student.id}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <FiUser />
                      <span>{student.firstName}</span>
                    </div>
                  </td>
                  <td>{student.middleName}</td>
                  <td>{student.lastName}</td>
                  <td>{student.gender}</td>
                  <td>{student.dob}</td>
                  <td>{student.program}</td>
                  <td>{student.yearLevel}</td>
                  <td>{student.section}</td>
                  <td>
                    <span className={`status-badge status-${student.status.replace(' ', '').toLowerCase()}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>{student.scholarship}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <FiMail />
                      <span>{student.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <FiPhone />
                      <span>{student.contact}</span>
                    </div>
                  </td>
                  <td>{student.dateEnrolled}</td>
                  <td>{student.guardian}</td>
                  <td>{student.guardianContact}</td>
                  <td>{student.violation}</td>
                  <td>
                    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
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
                      <button className="action-btn delete" type="button">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredStudents.length && (
                <tr>
                  <td colSpan="18" className="empty-row">
                    No students found for "{query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div className="student-modal-backdrop" onClick={() => setSelectedStudent(null)}>
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            <div className="breadcrumb-bar">
              <button className="breadcrumb-link" type="button" onClick={() => setSelectedStudent(null)}>
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
                <button
                  className="modal-close"
                  onClick={() => setSelectedStudent(null)}
                  aria-label="Close dialog"
                  type="button"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="modal-grid">
              <div>
                <p className="label">Profile Avatar URL</p>
                <input className="readonly-field" type="text" value={selectedStudent.profileAvatar || '-'} readOnly />
              </div>
              <div>
                <p className="label">Program / Course</p>
                <input className="readonly-field" type="text" value={selectedStudent.program} readOnly />
              </div>
              <div>
                <p className="label">Year Level</p>
                <input className="readonly-field" type="text" value={selectedStudent.yearLevel} readOnly />
              </div>
              <div>
                <p className="label">Section</p>
                <input className="readonly-field" type="text" value={selectedStudent.section} readOnly />
              </div>
              <div>
                <p className="label">Enrollment Status</p>
                <input className="readonly-field" type="text" value={selectedStudent.status} readOnly />
              </div>
              <div>
                <p className="label">Scholarship</p>
                <input className="readonly-field" type="text" value={selectedStudent.scholarship} readOnly />
              </div>
              <div>
                <p className="label">Date Enrolled</p>
                <input className="readonly-field" type="text" value={selectedStudent.dateEnrolled} readOnly />
              </div>
              <div>
                <p className="label">Date of Birth</p>
                <input className="readonly-field" type="text" value={selectedStudent.dob} readOnly />
              </div>
              <div>
                <p className="label">Gender</p>
                <input className="readonly-field" type="text" value={selectedStudent.gender} readOnly />
              </div>
              <div>
                <p className="label">Contact Number</p>
                <input className="readonly-field" type="text" value={selectedStudent.contact} readOnly />
              </div>
              <div>
                <p className="label">Email Address</p>
                <input className="readonly-field" type="text" value={selectedStudent.email} readOnly />
              </div>
              <div>
                <p className="label">Guardian</p>
                <input className="readonly-field" type="text" value={selectedStudent.guardian} readOnly />
              </div>
              <div>
                <p className="label">Guardian Contact Info</p>
                <input className="readonly-field" type="text" value={selectedStudent.guardianContact} readOnly />
              </div>
              <div>
                <p className="label">Violation</p>
                <input className="readonly-field" type="text" value={selectedStudent.violation} readOnly />
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
            setQuery('');
            setSelectedStudent(createdStudent);
          }}
          onUpdated={(updatedStudent) => {
            setStudents((prev) =>
              prev.map((s) => (s._id && updatedStudent._id && s._id === updatedStudent._id ? updatedStudent : s)),
            );
            setSelectedStudent(updatedStudent);
          }}
        />
      ) : null}
    </div>
  );
};

export default StudentInformation;
