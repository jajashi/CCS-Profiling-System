import React, { useState, useEffect, useCallback } from 'react';
import { FiFileText, FiDownload, FiSearch, FiFilter, FiUser, FiInfo, FiChevronLeft, FiChevronRight, FiLoader, FiExternalLink, FiBriefcase } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import FilterDropdown from '../../../components/Elements/FilterDropdown';
import toast from 'react-hot-toast';
import StudentSummaryModal from '../components/StudentSummaryModal';
import './ReportsPage.css';

const PROGRAM_OPTIONS = [
  { value: 'IT', label: 'BS Information Technology' },
  { value: 'CS', label: 'BS Computer Science' },
];

const YEAR_LEVEL_OPTIONS = [
  { value: '1st Year', label: '1st Year' },
  { value: '2nd Year', label: '2nd Year' },
  { value: '3rd Year', label: '3rd Year' },
  { value: '4th Year', label: '4th Year' },
];

const STATUS_OPTIONS = [
  { value: 'Regular', label: 'Regular' },
  { value: 'Irregular', label: 'Irregular' },
  { value: 'LOA', label: 'LOA' },
  { value: 'Transferee', label: 'Transferee' },
];

const ReportsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');
  const [scholarship, setScholarship] = useState('');
  
  const [activeTab, setActiveTab] = useState('students');
  const [faculty, setFaculty] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudentForSummary, setSelectedStudentForSummary] = useState(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    if (activeTab === 'students') {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page,
          limit: 10,
          search,
          program,
          yearLevel,
          status,
          gender,
          scholarship
        });
        
        const res = await apiFetch(`/api/reports/students?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch reports');
        
        const data = await res.json();
        setStudents(data.students);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    } else {
      setFacultyLoading(true);
      try {
        const params = new URLSearchParams({
          page,
          limit: 10,
          search
        });
        const res = await apiFetch(`/api/reports/faculty?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch faculty reports');
        const data = await res.json();
        setFaculty(data.faculty);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setFacultyLoading(false);
      }
    }
  }, [page, search, program, yearLevel, status, gender, scholarship, activeTab]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, program, yearLevel, status, gender, scholarship]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportPDF = async (studentId, studentName) => {
    try {
      const res = await apiFetch(`/api/reports/students/${studentId}/export`);
      if (!res.ok) throw new Error('Failed to generate PDF');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Profile_${studentName}_${studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRowClick = (student) => {
    setSelectedStudentForSummary(student);
    setIsSummaryModalOpen(true);
  };

  const handleViewDossier = (studentId) => {
    window.open(`/dashboard/reports/dossier/${studentId}`, '_blank');
  };

  return (
    <div className="reports-page">
      <div className="directory-hero reports-hero">
        <div className="directory-hero-icon">
          <FiFileText />
        </div>
        <div>
          <p className="directory-hero-title">Reporting & Analytics</p>
          <p className="directory-hero-subtitle">
            <FiInfo />
            <span>Generate student dossiers, demographic summaries, and exportable PDF profiles.</span>
          </p>
        </div>
      </div>

      <div className="reports-tabs">
        <button 
          className={`report-tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <FiUser />
          <span>Student Reports</span>
        </button>
        <button 
          className={`report-tab ${activeTab === 'faculty' ? 'active' : ''}`}
          onClick={() => setActiveTab('faculty')}
        >
          <FiBriefcase className="mr-1" />
          <span>Faculty Load Reports</span>
        </button>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <FiSearch />
            <input 
              type="text" 
              placeholder="Search by name or student ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-actions">
            <button 
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter />
              <span>Advanced Filters</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="filter-panel">
            <div className="filter-grid">
              <FilterDropdown 
                label="Program"
                options={PROGRAM_OPTIONS}
                value={program}
                onChange={setProgram}
                placeholder="All Programs"
              />
              <FilterDropdown 
                label="Year Level"
                options={YEAR_LEVEL_OPTIONS}
                value={yearLevel}
                onChange={setYearLevel}
                placeholder="All Years"
              />
              <FilterDropdown 
                label="Status"
                options={STATUS_OPTIONS}
                value={status}
                onChange={setStatus}
                placeholder="All Status"
              />
              <FilterDropdown 
                label="Gender"
                options={[{value: 'Male', label: 'Male'}, {value: 'Female', label: 'Female'}]}
                value={gender}
                onChange={setGender}
                placeholder="All Genders"
              />
            </div>
          </div>
        )}

        <div className="results-summary">
          <span>Showing <strong>{activeTab === 'students' ? students.length : faculty.length}</strong> of <strong>{total}</strong> records</span>
        </div>

        <div className="reports-table-container">
          {activeTab === 'students' ? (
            <table className="student-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Academic Info</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10">
                      <FiLoader className="animate-spin inline-block mr-2" />
                      Loading report data...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-500">
                      No students found matching filters.
                    </td>
                  </tr>
                ) : (
                  students.map(student => (
                    <tr 
                      key={student._id} 
                      className="clickable-row"
                      onClick={() => handleRowClick(student)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="report-avatar">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{student.lastName}, {student.firstName}</span>
                            <span className="text-xs text-slate-500">{student.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{student.program}</span>
                          <span className="text-xs text-slate-400">{student.yearLevel}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${student.status?.toLowerCase()}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            className="action-btn view" 
                            title="View 360 Dossier"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDossier(student._id);
                            }}
                          >
                            <FiExternalLink />
                          </button>
                          <button 
                            className="action-btn edit" 
                            title="Export PDF"
                            onClick={() => handleExportPDF(student._id, `${student.firstName}_${student.lastName}`)}
                          >
                            <FiDownload />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="student-table">
              <thead>
                <tr>
                  <th>Faculty Member</th>
                  <th>Teaching Load</th>
                  <th>Contact</th>
                  <th className="text-center">Specializations</th>
                </tr>
              </thead>
              <tbody>
                {facultyLoading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10">
                      <FiLoader className="animate-spin inline-block mr-2" />
                      Loading faculty data...
                    </td>
                  </tr>
                ) : faculty.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-500">
                      No faculty found.
                    </td>
                  </tr>
                ) : (
                  faculty.map(f => (
                    <tr key={f._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="report-avatar faculty">
                            {f.profileAvatar ? (
                               <img src={f.profileAvatar} alt={f.firstName} className="w-full h-full object-cover rounded-full" />
                            ) : (
                               <span>{f.firstName[0]}{f.lastName[0]}</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{f.lastName}, {f.firstName}</span>
                            <span className="text-xs text-slate-500">{f.employeeId}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-orange-600">{f.sectionCount} Sections</span>
                          <span className="text-xs text-slate-400">Current Semester</span>
                        </div>
                      </td>
                      <td>
                         <span className="text-sm text-slate-600">{f.email}</span>
                      </td>
                      <td className="text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {f.specializations?.map((s, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination-bar">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="pagination-btn"
            >
              <FiChevronLeft /> Previous
            </button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="pagination-btn"
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      {isSummaryModalOpen && selectedStudentForSummary && (
        <StudentSummaryModal 
          student={selectedStudentForSummary}
          onClose={() => {
            setIsSummaryModalOpen(false);
            setSelectedStudentForSummary(null);
          }}
          onViewFullDossier={handleViewDossier}
        />
      )}
    </div>
  );
};

export default ReportsPage;
