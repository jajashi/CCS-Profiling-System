import React, { useState, useEffect, useCallback } from 'react';
import { FiFileText, FiDownload, FiSearch, FiFilter, FiUser, FiInfo, FiChevronLeft, FiChevronRight, FiLoader, FiExternalLink, FiBriefcase } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import FilterDropdown from '../../../components/Elements/FilterDropdown';
import toast from 'react-hot-toast';
import StudentSummaryModal from '../components/StudentSummaryModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  
  const [facultyLoading, setFacultyLoading] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudentForSummary, setSelectedStudentForSummary] = useState(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const fetchReports = useCallback(async () => {
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
  }, [page, search, program, yearLevel, status, gender, scholarship]);

  useEffect(() => {
    setPage(1);
  }, [search, program, yearLevel, status, gender, scholarship]);

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

  const handleExportOverallReport = async () => {
    toast.loading("Generating executive report...", { id: "overall-export" });
    try {
      const params = new URLSearchParams({
        page: 1,
        limit: 10000,
        search,
        program,
        yearLevel,
        status,
        gender,
        scholarship
      });
      
      const res = await apiFetch(`/api/reports/students?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch data for report');
      const data = await res.json();
      const allStudents = data.students;

      if (allStudents.length === 0) {
        throw new Error("No students match the current filters.");
      }

      // Compute Demographics
      const programs = {};
      const yearLevels = {};
      const statuses = {};
      const genders = {};
      const scholarships = {};
      let totalViolations = 0;

      allStudents.forEach(s => {
        programs[s.program || 'Unspecified'] = (programs[s.program || 'Unspecified'] || 0) + 1;
        yearLevels[s.yearLevel || 'Unspecified'] = (yearLevels[s.yearLevel || 'Unspecified'] || 0) + 1;
        statuses[s.status || 'Unspecified'] = (statuses[s.status || 'Unspecified'] || 0) + 1;
        genders[s.gender || 'Unspecified'] = (genders[s.gender || 'Unspecified'] || 0) + 1;
        
        const schol = s.scholarship || 'None';
        scholarships[schol] = (scholarships[schol] || 0) + 1;
        
        if (s.violation && s.violation.trim() !== '') totalViolations++;
      });

      const doc = new jsPDF('portrait');
      
      // --- COVER PAGE ---
      doc.setFontSize(24);
      doc.setTextColor(30, 41, 59);
      doc.text("College of Computer Studies", 105, 80, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setTextColor(99, 102, 241);
      doc.text("Executive Student Demographics Report", 105, 95, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 120, { align: 'center' });
      doc.text(`Total Records: ${allStudents.length}`, 105, 128, { align: 'center' });
      
      // Filters Applied
      const filtersApplied = [];
      if (search) filtersApplied.push(`Search: "${search}"`);
      if (program) filtersApplied.push(`Program: ${program}`);
      if (yearLevel) filtersApplied.push(`Year: ${yearLevel}`);
      if (status) filtersApplied.push(`Status: ${status}`);
      if (gender) filtersApplied.push(`Gender: ${gender}`);
      if (scholarship) filtersApplied.push(`Scholarship: ${scholarship}`);
      
      if (filtersApplied.length > 0) {
        doc.setFontSize(10);
        doc.text("Filters Applied: " + filtersApplied.join(", "), 105, 140, { align: 'center' });
      } else {
        doc.text("Filters Applied: None (All Students)", 105, 140, { align: 'center' });
      }
      
      doc.addPage('portrait');
      
      // --- EXECUTIVE SUMMARY ---
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text("Executive Summary", 14, 22);
      
      let currentY = 35;
      
      const drawSummaryTable = (title, dataObj, startY, startX = 14) => {
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text(title, startX, startY);
        const body = Object.entries(dataObj).sort((a,b) => b[1] - a[1]);
        autoTable(doc, {
          startY: startY + 4,
          margin: { left: startX },
          tableWidth: 80,
          head: [['Category', 'Count']],
          body: body,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] }
        });
        return doc.lastAutoTable.finalY;
      };

      let y1 = drawSummaryTable("Program Distribution", programs, currentY, 14);
      let y2 = drawSummaryTable("Year Level Breakdown", yearLevels, currentY, 110);
      
      currentY = Math.max(y1, y2) + 20;
      
      y1 = drawSummaryTable("Status Distribution", statuses, currentY, 14);
      y2 = drawSummaryTable("Gender Ratio", genders, currentY, 110);
      
      currentY = Math.max(y1, y2) + 20;
      
      y1 = drawSummaryTable("Scholarship Distribution", scholarships, currentY, 14);
      
      doc.setFontSize(12);
      doc.text("Disciplinary Overview", 110, currentY);
      autoTable(doc, {
        startY: currentY + 4,
        margin: { left: 110 },
        tableWidth: 80,
        head: [['Metric', 'Count']],
        body: [
          ['Clean Record', allStudents.length - totalViolations],
          ['With Violations', totalViolations]
        ],
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] } // Red header for discipline
      });
      
      doc.addPage('landscape');
      
      // --- DETAILED REGISTRY ---
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text("Detailed Student Registry", 14, 22);
      
      const tableColumn = ["Student ID", "First Name", "Last Name", "Program", "Year Level", "Section", "Status", "Gender", "Scholarship"];
      const tableRows = [];

      allStudents.forEach(student => {
        tableRows.push([
          student.id,
          student.firstName,
          student.lastName,
          student.program || 'N/A',
          student.yearLevel || 'N/A',
          student.section || 'N/A',
          student.status || 'N/A',
          student.gender || 'N/A',
          student.scholarship || 'None'
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [99, 102, 241] },
        didDrawPage: function (data) {
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

      doc.save(`ccs-executive-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Executive report generated successfully!", { id: "overall-export" });
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to generate report", { id: "overall-export" });
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
          className="report-tab active"
        >
          <FiUser />
          <span>Student Reports</span>
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
              className="export-overall-btn"
              onClick={handleExportOverallReport}
              title="Export filtered list to PDF"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                marginRight: '1rem'
              }}
            >
              <FiDownload />
              <span>Generate Overall Report</span>
            </button>
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
          <span>Showing <strong>{students.length}</strong> of <strong>{total}</strong> records</span>
        </div>

        <div className="reports-table-container">
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
