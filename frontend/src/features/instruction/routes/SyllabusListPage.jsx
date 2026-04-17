import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiArchive, FiBookOpen, FiEdit2, FiEye, FiLayers, FiPlus, FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import AddEditSyllabusModal from '../components/AddEditSyllabusModal';
import SyllabusQuickViewModal from '../components/SyllabusQuickViewModal';
import '../../students/routes/StudentInformation.css';
import '../../faculty/routes/SpecializationManagement.css';
import './SyllabusPages.css';

const STATUS_OPTIONS = ['Draft', 'Active', 'Archived'];

function buildFacultyName(faculty) {
  if (!faculty) return 'Unassigned';
  const parts = [faculty.firstName, faculty.lastName].filter(Boolean);
  if (!parts.length && faculty.employeeId) return faculty.employeeId;
  return parts.join(' ') || 'Unassigned';
}

function getSectionValue(section, key) {
  if (!section || typeof section !== 'object') return '';
  return String(section[key] || '').trim();
}

function SyllabusSkeletonRows() {
  return Array.from({ length: 6 }, (_, index) => (
    <tr key={`syllabus-skeleton-${index}`} className="skeleton-row">
      <td><span className="skeleton-block" style={{ width: '92px' }} /></td>
      <td><span className="skeleton-block" style={{ width: '180px' }} /></td>
      <td><span className="skeleton-block" style={{ width: '88px' }} /></td>
      <td><span className="skeleton-block" style={{ width: '74px' }} /></td>
      <td><span className="skeleton-block" style={{ width: '140px' }} /></td>
      <td><span className="skeleton-block" style={{ width: '84px' }} /></td>
      <td><span className="skeleton-block" style={{ width: '104px' }} /></td>
      <td><span className="skeleton-block" style={{ width: '72px' }} /></td>
      <td><span className="skeleton-block" style={{ width: '146px' }} /></td>
    </tr>
  ));
}

export default function SyllabusListPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [archiveSubmittingId, setArchiveSubmittingId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSyllabusId, setEditingSyllabusId] = useState('');
  const [previewSyllabusId, setPreviewSyllabusId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [syllabiRes, facultyRes] = await Promise.all([
        apiFetch('/api/syllabi'),
        apiFetch('/api/faculty?status=Active'),
      ]);

      const syllabiData = await syllabiRes.json().catch(() => []);
      const facultyData = await facultyRes.json().catch(() => []);

      if (!syllabiRes.ok) {
        throw new Error(syllabiData?.message || `Could not load syllabi (${syllabiRes.status}).`);
      }

      if (!facultyRes.ok) {
        throw new Error(facultyData?.message || `Could not load active faculty (${facultyRes.status}).`);
      }

      const nextRows = Array.isArray(syllabiData) ? syllabiData : [];
      const nextFacultyOptions = Array.isArray(facultyData)
        ? facultyData
            .filter((member) => String(member.status || '') === 'Active')
            .map((member) => ({
              value: member._id,
              label: `${buildFacultyName(member)}${member.employeeId ? ` (${member.employeeId})` : ''}`,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
        : [];

      setRows(nextRows);
      setFacultyOptions(nextFacultyOptions);
    } catch (err) {
      setRows([]);
      setFacultyOptions([]);
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const termOptions = useMemo(() => {
    return [...new Set(rows.map((row) => getSectionValue(row.sectionId, 'term')).filter(Boolean))].sort();
  }, [rows]);

  const academicYearOptions = useMemo(() => {
    return [...new Set(rows.map((row) => getSectionValue(row.sectionId, 'academicYear')).filter(Boolean))].sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return rows.filter((row) => {
      const isArchived = String(row.status || '') === 'Archived';
      if (isArchived && !showArchived) return false;
      if (termFilter && getSectionValue(row.sectionId, 'term') !== termFilter) return false;
      if (academicYearFilter && getSectionValue(row.sectionId, 'academicYear') !== academicYearFilter) return false;
      if (statusFilter && String(row.status || '') !== statusFilter) return false;
      if (facultyFilter && String(row.facultyId?._id || row.facultyId || '') !== facultyFilter) return false;

      if (!searchTerm) return true;

      return [
        row.curriculumId?.courseCode,
        row.curriculumId?.courseTitle,
        getSectionValue(row.sectionId, 'sectionIdentifier'),
        buildFacultyName(row.facultyId),
        getSectionValue(row.sectionId, 'term'),
        getSectionValue(row.sectionId, 'academicYear'),
        row.curriculumId?.curriculumYear,
        row.status,
      ].some((value) => String(value || '').toLowerCase().includes(searchTerm));
    });
  }, [academicYearFilter, facultyFilter, rows, search, showArchived, statusFilter, termFilter]);

  const handleArchive = async (row) => {
    if (!row?._id || archiveSubmittingId) return;
    const confirmed = window.confirm(`Archive syllabus for ${row.curriculumId?.courseCode || 'this course'}?`);
    if (!confirmed) return;

    setArchiveSubmittingId(row._id);
    try {
      const res = await apiFetch(`/api/syllabi/${row._id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.message || `Archive failed (${res.status}).`);
        return;
      }
      toast.success('Syllabus archived.');
      await loadData();
    } catch {
      toast.error('Network error while archiving syllabus.');
    } finally {
      setArchiveSubmittingId('');
    }
  };

  const openCreateModal = () => {
    setEditingSyllabusId('');
    setIsFormOpen(true);
  };

  const openEditModal = (syllabusId) => {
    if (!syllabusId) return;
    setEditingSyllabusId(syllabusId);
    setIsFormOpen(true);
  };

  const closeModal = () => {
    setIsFormOpen(false);
    setEditingSyllabusId('');
  };

  return (
    <div className="student-directory spec-page syllabi-page">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon"><FiBookOpen /></div>
        <div>
          <p className="directory-hero-title">Syllabus library</p>
          <p className="directory-hero-subtitle">
            <span>Review course syllabi, filter by term or faculty, and open a clean print-friendly document view.</span>
          </p>
        </div>
      </div>

      <div className="spec-card">
        <div className="spec-toolbar syllabus-toolbar">
          <div className="spec-toolbar-meta">
            <h2 className="spec-toolbar-title">Syllabi list</h2>
            <p className="spec-toolbar-sub">Find draft and active syllabi quickly, with archived entries hidden by default.</p>
            {!loading ? <span className="spec-count-pill">{filteredRows.length} results</span> : null}
          </div>
          <div className="syllabus-toolbar-actions">
            <button type="button" className="spec-btn-primary" onClick={openCreateModal}>
              <FiPlus />
              <span>Add Syllabus</span>
            </button>
            <label className="syllabus-archive-toggle">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
              />
              <span>Show Archived</span>
            </label>
          </div>
        </div>

        <div className="curriculum-filters-row syllabus-filters-row">
          <div className="search-box curriculum-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by course, section, faculty, term, or status"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select className="filter-select curriculum-select" value={termFilter} onChange={(event) => setTermFilter(event.target.value)} disabled={loading}>
            <option value="">All Terms</option>
            {termOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select className="filter-select curriculum-select" value={academicYearFilter} onChange={(event) => setAcademicYearFilter(event.target.value)} disabled={loading}>
            <option value="">All Academic Years</option>
            {academicYearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select className="filter-select curriculum-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} disabled={loading}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select className="filter-select curriculum-select" value={facultyFilter} onChange={(event) => setFacultyFilter(event.target.value)} disabled={loading}>
            <option value="">All Active Faculty</option>
            {facultyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        {error ? <div className="spec-alert" role="alert">{error}</div> : null}

        <div className="spec-table-wrap">
          <table className="spec-table syllabus-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Curriculum year</th>
                <th>Section</th>
                <th>Faculty Name</th>
                <th>Term</th>
                <th>Academic Year</th>
                <th>Status</th>
                <th className="spec-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SyllabusSkeletonRows /> : null}
              {!loading && !filteredRows.length ? (
                <tr>
                  <td colSpan={9} className="spec-empty">No syllabi matched the current filters.</td>
                </tr>
              ) : null}
              {!loading ? filteredRows.map((row) => {
                const archived = String(row.status || '') === 'Archived';
                const archiveDisabled = archived || (!isAdmin && String(row.status || '') === 'Active');
                return (
                  <tr key={row._id} className={archived ? 'row-inactive' : ''}>
                    <td><span className={`id-badge ${archived ? 'curriculum-archived-badge' : ''}`}>{row.curriculumId?.courseCode || '-'}</span></td>
                    <td className={archived ? 'faculty-directory-name-inactive' : ''}>{row.curriculumId?.courseTitle || '-'}</td>
                    <td>{row.curriculumId?.curriculumYear?.trim() || '—'}</td>
                    <td>{getSectionValue(row.sectionId, 'sectionIdentifier') || '-'}</td>
                    <td>{buildFacultyName(row.facultyId)}</td>
                    <td>{getSectionValue(row.sectionId, 'term') || '-'}</td>
                    <td>{getSectionValue(row.sectionId, 'academicYear') || '-'}</td>
                    <td><span className={`status-badge status-${String(row.status || '').toLowerCase()}`}>{row.status || '-'}</span></td>
                    <td className="spec-td-actions">
                      <div className="spec-actions">
                        <Link to={`/dashboard/instruction/syllabi/${row._id}`} className="spec-btn-ghost syllabus-action-link" title="View syllabus">
                          <FiEye />
                          <span>View</span>
                        </Link>
                        <button
                          type="button"
                          className="spec-btn-ghost"
                          onClick={() => setPreviewSyllabusId(row._id)}
                          title="Quick preview in modal"
                        >
                          <FiLayers />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          className="spec-btn-ghost"
                          onClick={() => openEditModal(row._id)}
                        >
                          <FiEdit2 />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="spec-btn-ghost spec-btn-danger"
                          onClick={() => handleArchive(row)}
                          disabled={archiveDisabled || archiveSubmittingId === row._id}
                          title={
                            archived
                              ? 'Already archived'
                              : !isAdmin && String(row.status || '') === 'Active'
                                ? 'Only admins can archive active syllabi'
                                : 'Archive syllabus'
                          }
                        >
                          <FiArchive />
                          <span>{archiveSubmittingId === row._id ? 'Archiving...' : 'Archive'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : null}
            </tbody>
          </table>
        </div>
      </div>

      <AddEditSyllabusModal
        isOpen={isFormOpen}
        onClose={closeModal}
        editSyllabusId={editingSyllabusId || null}
        onSuccess={loadData}
      />

      <SyllabusQuickViewModal
        syllabusId={previewSyllabusId}
        isOpen={Boolean(previewSyllabusId)}
        onClose={() => setPreviewSyllabusId('')}
      />
    </div>
  );
}
