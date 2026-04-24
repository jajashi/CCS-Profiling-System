import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiArchive, FiBookOpen, FiChevronLeft, FiChevronRight, FiEdit2, FiEye, FiPlus, FiRotateCcw, FiSearch, FiX } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import { readFacultyCache, writeFacultyCache } from '../../../lib/facultyPortalCache';
import { useAuth } from '../../../providers/AuthContext';
import CurriculumYearPicker from '../components/CurriculumYearPicker';
import '../../students/routes/StudentInformation.css';
import '../../faculty/routes/SpecializationManagement.css';
import './CurriculaManagement.css';

const PROGRAM_OPTIONS = ['IT', 'CS', 'General'];
const STATUS_OPTIONS = ['Active', 'Archived', 'All'];
const MAX_COURSE_CODE_LEN = 8;
const PAGE_SIZE = 50;

function curriculaCacheKey(programFilter, statusFilter) {
  return `curricula:${programFilter}:${statusFilter}`;
}

const CURRENT_YEAR = new Date().getFullYear();
const CURRICULUM_YEAR_MIN = 2000;
const CURRICULUM_YEAR_MAX = CURRENT_YEAR + 15;

/** Map legacy free-text values (e.g. "2024–2025") to a year in the picker range. */
function normalizeCurriculumYearForPicker(raw) {
  const s = String(raw ?? '').trim();
  const m = s.match(/\b(19|20)\d{2}\b/);
  if (m) {
    const y = parseInt(m[0], 10);
    if (y >= CURRICULUM_YEAR_MIN && y <= CURRICULUM_YEAR_MAX) return String(y);
    if (y < CURRICULUM_YEAR_MIN) return String(CURRICULUM_YEAR_MIN);
    if (y > CURRICULUM_YEAR_MAX) return String(CURRICULUM_YEAR_MAX);
  }
  return String(CURRENT_YEAR);
}

function emptyForm() {
  return {
    courseCode: '',
    courseTitle: '',
    curriculumYear: String(CURRENT_YEAR),
    description: '',
    program: 'IT',
    creditUnits: 3,
    lectureHours: 3,
    labHours: 0,
    prerequisites: [],
    courseLearningOutcomes: [''],
  };
}

function CurriculumFormModal({ mode, initialData, onClose, onSaved, options }) {
  const [form, setForm] = useState(() => (initialData ? { ...initialData } : emptyForm()));
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initialData ? { ...initialData } : emptyForm());
    setErrors({});
    setApiError('');
  }, [initialData]);

  const prerequisiteOptions = useMemo(() => {
    const currentCode = String(form.courseCode || '').trim().toUpperCase();
    return options.filter((code) => code !== currentCode);
  }, [options, form.courseCode]);

  const validate = () => {
    const nextErrors = {};
    const code = String(form.courseCode || '').trim().toUpperCase();
    if (!code) nextErrors.courseCode = 'Course code is required.';
    else if (code.length > MAX_COURSE_CODE_LEN) nextErrors.courseCode = `Course code must be at most ${MAX_COURSE_CODE_LEN} characters.`;
    if (!String(form.courseTitle || '').trim()) nextErrors.courseTitle = 'Course title is required.';
    const cy = String(form.curriculumYear || '').trim();
    if (!cy) nextErrors.curriculumYear = 'Curriculum year is required.';
    else if (!/^\d{4}$/.test(cy) || Number(cy) < CURRICULUM_YEAR_MIN || Number(cy) > CURRICULUM_YEAR_MAX) {
      nextErrors.curriculumYear = `Curriculum year must be between ${CURRICULUM_YEAR_MIN} and ${CURRICULUM_YEAR_MAX}.`;
    }
    if (!PROGRAM_OPTIONS.includes(form.program)) nextErrors.program = 'Program must be IT, CS, or General.';
    const creditUnits = Number(form.creditUnits);
    if (!Number.isFinite(creditUnits) || creditUnits < 1 || creditUnits > 6) nextErrors.creditUnits = 'Credit units must be between 1 and 6.';
    const lectureHours = Number(form.lectureHours);
    if (!Number.isFinite(lectureHours) || lectureHours < 0) nextErrors.lectureHours = 'Lecture hours must be 0 or greater.';
    const labHours = Number(form.labHours);
    if (!Number.isFinite(labHours) || labHours < 0) nextErrors.labHours = 'Lab hours must be 0 or greater.';
    const cleanClos = (form.courseLearningOutcomes || []).map((v) => String(v || '').trim()).filter(Boolean);
    if (cleanClos.length === 0) nextErrors.courseLearningOutcomes = 'At least one non-empty CLO is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const togglePrerequisite = (code) => {
    setForm((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites.includes(code)
        ? prev.prerequisites.filter((value) => value !== code)
        : [...prev.prerequisites, code],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError('');
    try {
      const payload = {
        ...form,
        courseCode: String(form.courseCode || '').trim().toUpperCase(),
        courseTitle: String(form.courseTitle || '').trim(),
        curriculumYear: String(form.curriculumYear || '').trim(),
        description: String(form.description || '').trim(),
        creditUnits: Number(form.creditUnits),
        lectureHours: Number(form.lectureHours),
        labHours: Number(form.labHours),
        prerequisites: [...new Set(form.prerequisites)],
        courseLearningOutcomes: (form.courseLearningOutcomes || []).map((value) => String(value || '').trim()).filter(Boolean),
      };

      const isEdit = mode === 'edit';
      const res = await apiFetch(isEdit ? `/api/curricula/${initialData._id}` : '/api/curricula', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = data?.message || `Request failed (${res.status}).`;
        setApiError(message);
        if (res.status === 409 && /courseCode/i.test(message)) setErrors((prev) => ({ ...prev, courseCode: message }));
        if (res.status === 400 && /curriculumYear/i.test(message)) setErrors((prev) => ({ ...prev, curriculumYear: message }));
        return;
      }
      onSaved(data);
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spec-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="curriculum-modal-title">
      <div className="spec-modal spec-modal--wide curriculum-modal">
        <div className="spec-modal-header">
          <div>
            <p className="spec-modal-eyebrow">Curriculum</p>
            <h2 id="curriculum-modal-title" className="spec-modal-title">{mode === 'edit' ? 'Edit curriculum' : 'Add curriculum'}</h2>
            <p className="spec-modal-sub">
              {mode === 'edit'
                ? 'Update curriculum details, prerequisites, and CLOs.'
                : 'Create a curriculum record with validated course metadata.'}
            </p>
          </div>
          <button type="button" className="spec-modal-close" onClick={onClose} disabled={submitting} aria-label="Close"><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="curriculum-modal-form">
          <div className="spec-modal-body curriculum-form-grid">
            <label className="spec-field-label" htmlFor="courseCode">Course code</label>
            <input id="courseCode" className="spec-field-input" maxLength={MAX_COURSE_CODE_LEN} value={form.courseCode} onChange={(e) => setForm((prev) => ({ ...prev, courseCode: e.target.value.toUpperCase().slice(0, MAX_COURSE_CODE_LEN) }))} disabled={submitting} />
            {errors.courseCode ? <p className="spec-field-error">{errors.courseCode}</p> : null}

            <label className="spec-field-label" htmlFor="courseTitle">Course title</label>
            <input id="courseTitle" className="spec-field-input" value={form.courseTitle} onChange={(e) => setForm((prev) => ({ ...prev, courseTitle: e.target.value }))} disabled={submitting} />
            {errors.courseTitle ? <p className="spec-field-error">{errors.courseTitle}</p> : null}

            <label className="spec-field-label" htmlFor="program">Program</label>
            <select id="program" className="spec-field-input" value={form.program} onChange={(e) => setForm((prev) => ({ ...prev, program: e.target.value }))} disabled={submitting}>
              {PROGRAM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            {errors.program ? <p className="spec-field-error">{errors.program}</p> : null}

            <label className="spec-field-label" htmlFor="curriculumYear">
              Curriculum year (catalog){' '}
              <span className="curriculum-required-mark" title="Required">*</span>
            </label>
            <CurriculumYearPicker
              id="curriculumYear"
              value={form.curriculumYear}
              onChange={(v) => setForm((prev) => ({ ...prev, curriculumYear: v }))}
              disabled={submitting}
              minYear={CURRICULUM_YEAR_MIN}
              maxYear={CURRICULUM_YEAR_MAX}
              todayYear={CURRENT_YEAR}
              error={Boolean(errors.curriculumYear)}
            />
            {errors.curriculumYear ? <p className="spec-field-error">{errors.curriculumYear}</p> : null}
            <p className="spec-field-hint">Catalog or revision year for this course definition.</p>

            <div className="curriculum-three-col">
              <div>
                <label className="spec-field-label" htmlFor="creditUnits">Credit units</label>
                <input id="creditUnits" type="number" min={1} max={6} className="spec-field-input" value={form.creditUnits} onChange={(e) => setForm((prev) => ({ ...prev, creditUnits: e.target.value }))} disabled={submitting} />
                {errors.creditUnits ? <p className="spec-field-error">{errors.creditUnits}</p> : null}
              </div>
              <div>
                <label className="spec-field-label" htmlFor="lectureHours">Lecture hours</label>
                <input id="lectureHours" type="number" min={0} className="spec-field-input" value={form.lectureHours} onChange={(e) => setForm((prev) => ({ ...prev, lectureHours: e.target.value }))} disabled={submitting} />
                {errors.lectureHours ? <p className="spec-field-error">{errors.lectureHours}</p> : null}
              </div>
              <div>
                <label className="spec-field-label" htmlFor="labHours">Lab hours</label>
                <input id="labHours" type="number" min={0} className="spec-field-input" value={form.labHours} onChange={(e) => setForm((prev) => ({ ...prev, labHours: e.target.value }))} disabled={submitting} />
                {errors.labHours ? <p className="spec-field-error">{errors.labHours}</p> : null}
              </div>
            </div>

            <label className="spec-field-label" htmlFor="description">Description (optional)</label>
            <textarea id="description" className="spec-field-textarea" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} disabled={submitting} />

            <span className="spec-field-label" id="curriculum-prereq-label">Prerequisites</span>
            <div
              id="curriculum-prerequisites-list"
              className={`curriculum-prereq-box ${prerequisiteOptions.length === 0 ? 'curriculum-prereq-box--empty' : ''}`}
              role="group"
              aria-labelledby="curriculum-prereq-label"
            >
              {prerequisiteOptions.map((code) => (
                <label key={code} className="curriculum-prereq-option">
                  <input type="checkbox" checked={form.prerequisites.includes(code)} onChange={() => togglePrerequisite(code)} disabled={submitting} />
                  <span>{code}</span>
                </label>
              ))}
              {prerequisiteOptions.length === 0 ? <p className="curriculum-muted">No other active course codes available.</p> : null}
            </div>

            <label className="spec-field-label">Course learning outcomes (CLOs)</label>
            <div className="curriculum-clo-list">
              {form.courseLearningOutcomes.map((value, index) => (
                <div className="curriculum-clo-row" key={`clo-${index}`}>
                  <input className="spec-field-input" value={value} onChange={(e) => setForm((prev) => {
                    const next = [...prev.courseLearningOutcomes];
                    next[index] = e.target.value;
                    return { ...prev, courseLearningOutcomes: next };
                  })} disabled={submitting} />
                  <button type="button" className="spec-btn-ghost" onClick={() => setForm((prev) => ({ ...prev, courseLearningOutcomes: prev.courseLearningOutcomes.filter((_, i) => i !== index) }))} disabled={submitting || form.courseLearningOutcomes.length <= 1}>Remove</button>
                </div>
              ))}
            </div>
            <button type="button" className="spec-btn-secondary" onClick={() => setForm((prev) => ({ ...prev, courseLearningOutcomes: [...prev.courseLearningOutcomes, ''] }))} disabled={submitting}>Add CLO</button>
            {errors.courseLearningOutcomes ? <p className="spec-field-error">{errors.courseLearningOutcomes}</p> : null}
            {apiError ? <p className="spec-field-error">{apiError}</p> : null}
          </div>
          <div className="spec-modal-footer">
            <button type="button" className="spec-btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="spec-btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save curriculum'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CurriculaManagement() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState(() => {
    const c = readFacultyCache(curriculaCacheKey('All', 'Active'));
    return !isAdmin && c?.rows && Array.isArray(c.rows) ? c.rows : [];
  });
  const [loading, setLoading] = useState(() => {
    if (isAdmin) return true;
    const c = readFacultyCache(curriculaCacheKey('All', 'Active'));
    return !c?.rows;
  });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [formModal, setFormModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [restoreSubmittingId, setRestoreSubmittingId] = useState('');
  const [activeCodes, setActiveCodes] = useState([]);
  const [viewRow, setViewRow] = useState(null);

  const loadActiveCodes = useCallback(async () => {
    try {
      const res = await apiFetch('/api/curricula?status=Active');
      const data = await res.json().catch(() => []);
      if (!res.ok) return;
      const codes = Array.isArray(data) ? data.map((row) => String(row.courseCode || '').trim().toUpperCase()).filter(Boolean) : [];
      setActiveCodes(codes);
    } catch {
      setActiveCodes([]);
    }
  }, []);

  const loadCurricula = useCallback(async () => {
    const cacheKey = !isAdmin ? curriculaCacheKey(programFilter, statusFilter) : null;
    const cached = cacheKey ? readFacultyCache(cacheKey) : null;
    if (cached?.rows) {
      setRows(cached.rows);
      setLoading(false);
      setError('');
    } else {
      setLoading(true);
      setError('');
    }
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'All') params.set('status', statusFilter);
      else if (statusFilter === 'All') params.set('status', 'All');
      if (programFilter && programFilter !== 'All') params.set('program', programFilter);
      const queryString = params.toString();
      const res = await apiFetch(`/api/curricula${queryString ? `?${queryString}` : ''}`);
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        if (cacheKey && cached?.rows) {
          setError('');
        } else {
          setError(data?.message || `Could not load curricula (${res.status}).`);
          setRows([]);
        }
        return;
      }
      const nextRows = Array.isArray(data) ? data : [];
      setRows(nextRows);
      if (cacheKey) writeFacultyCache(cacheKey, { rows: nextRows });
    } catch {
      if (!cacheKey || !cached?.rows) {
        setError('Network error. Please try again.');
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, programFilter, statusFilter]);

  useEffect(() => { loadCurricula(); }, [loadCurricula]);
  useEffect(() => {
    if (isAdmin) loadActiveCodes();
  }, [isAdmin, loadActiveCodes]);
  useEffect(() => { setPage(1); }, [search, programFilter, statusFilter]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const year = String(row.curriculumYear || '').toLowerCase();
      return (
        String(row.courseCode || '').toLowerCase().includes(term)
        || String(row.courseTitle || '').toLowerCase().includes(term)
        || year.includes(term)
      );
    });
  }, [rows, search]);

  const totalPages = Math.max(Math.ceil(filteredRows.length / PAGE_SIZE), 1);
  const paginatedRows = useMemo(() => filteredRows.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE), [filteredRows, page]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { setPageInput(String(page || 1)); }, [page]);

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

  const openEdit = (row) => {
    setViewRow(null);
    setFormModal({
      mode: 'edit',
      data: {
        _id: row._id,
        courseCode: row.courseCode || '',
        courseTitle: row.courseTitle || '',
        curriculumYear: normalizeCurriculumYearForPicker(row.curriculumYear),
        description: row.description || '',
        program: row.program || 'IT',
        creditUnits: row.creditUnits ?? 1,
        lectureHours: row.lectureHours ?? 0,
        labHours: row.labHours ?? 0,
        prerequisites: Array.isArray(row.prerequisites) ? row.prerequisites : [],
        courseLearningOutcomes: Array.isArray(row.courseLearningOutcomes) && row.courseLearningOutcomes.length > 0 ? row.courseLearningOutcomes : [''],
      },
    });
  };

  const handleSaved = async () => {
    setFormModal(null);
    toast.success('Curriculum saved successfully.');
    await loadCurricula();
    await loadActiveCodes();
  };

  const openArchiveConfirm = (row) => {
    setViewRow(null);
    setDeleteTarget(row);
  };

  const handleArchive = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      const res = await apiFetch(`/api/curricula/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 400) toast.error(data?.message || 'This curriculum cannot be archived because it is used by an active/draft syllabus.');
        else toast.error(data?.message || `Archive failed (${res.status}).`);
        return;
      }
      toast.success('Curriculum archived.');
      setDeleteTarget(null);
      await loadCurricula();
      await loadActiveCodes();
    } catch {
      toast.error('Network error while archiving curriculum.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleRestore = async (row) => {
    if (!isAdmin || !row?._id) return;
    setViewRow(null);
    setRestoreSubmittingId(row._id);
    try {
      const res = await apiFetch(`/api/curricula/${row._id}/restore`, { method: 'PATCH' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.message || `Restore failed (${res.status}).`);
        return;
      }
      toast.success('Curriculum restored.');
      await loadCurricula();
      await loadActiveCodes();
    } catch {
      toast.error('Network error while restoring curriculum.');
    } finally {
      setRestoreSubmittingId('');
    }
  };

  return (
    <div className="student-directory spec-page curricula-page">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon"><FiBookOpen /></div>
        <div>
          <p className="directory-hero-title">Curriculum catalog</p>
          <p className="directory-hero-subtitle">
            <span>
              {isAdmin
                ? 'Manage course frameworks for IT, CS, and institution-wide General subjects.'
                : 'Browse course frameworks for IT, CS, and institution-wide General subjects. Editing is limited to administrators.'}
            </span>
          </p>
        </div>
      </div>

      <div className="spec-card">
        <div className="spec-toolbar curriculum-toolbar">
          <div className="spec-toolbar-meta">
            <h2 className="spec-toolbar-title">Curriculum list</h2>
            <p className="spec-toolbar-sub">
              Filter by program and status, then search by code or title.
            </p>
          </div>
          <div className="spec-toolbar-right">
            {!loading ? (
              <div className="student-count-badge">
                <FiBookOpen />
                <span>
                  {filteredRows.length} {filteredRows.length === 1 ? 'curriculum' : 'curricula'}
                </span>
              </div>
            ) : null}
            {isAdmin ? (
              <button type="button" className="spec-btn-primary" onClick={() => { setViewRow(null); setFormModal({ mode: 'create', data: emptyForm() }); }}>
                <FiPlus />
                <span>Add curriculum</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="curriculum-filters-row">
          <div className="search-box curriculum-search">
            <FiSearch />
            <input type="text" placeholder="Search by code, title, or curriculum year" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="filter-select curriculum-select" value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
            <option value="All">All Programs</option>
            {PROGRAM_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select className="filter-select curriculum-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>

        {!loading ? (
          <div className="results-count">
            <div className="results-count-text">
              Showing <strong>{filteredRows.length}</strong>{' '}
              {filteredRows.length === 1 ? 'curriculum' : 'curricula'}
            </div>
            {filteredRows.length > PAGE_SIZE ? (
              <div className="results-count-pagination" aria-label="Top pagination controls">
                <button
                  className="pagination-btn pagination-btn-sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={!hasPrev}
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
                  />
                </label>
                <span className="pagination-info pagination-info-sm">of {totalPages}</span>
                <button
                  className="pagination-btn pagination-btn-sm"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={!hasNext}
                  type="button"
                  aria-label="Next page"
                >
                  <FiChevronRight />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <div className="spec-alert">{error}</div> : null}

        <div className="spec-table-wrap">
          <table className="spec-table curriculum-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Curriculum year</th>
                <th>Program</th>
                <th>Credit Units</th>
                <th>Total Hours</th>
                <th>Status</th>
                <th className="spec-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="spec-loading">Loading curricula...</td></tr> : null}
              {!loading && paginatedRows.length === 0 ? <tr><td colSpan={8} className="spec-empty">No curricula found.</td></tr> : null}
              {!loading ? paginatedRows.map((row) => {
                const archived = row.status === 'Archived';
                return (
                  <tr
                    key={row._id}
                    className={`${archived ? 'row-inactive' : ''} spec-table-row-clickable`.trim()}
                    onClick={() => setViewRow(row)}
                  >
                    <td><span className={`id-badge ${archived ? 'curriculum-archived-badge' : ''}`}>{row.courseCode}</span></td>
                    <td className={archived ? 'faculty-directory-name-inactive' : ''}>{row.courseTitle}</td>
                    <td>{row.curriculumYear || '—'}</td>
                    <td>{row.program}</td>
                    <td>{row.creditUnits}</td>
                    <td>{Number(row.lectureHours || 0) + Number(row.labHours || 0)}</td>
                    <td><span className={`status-badge status-${String(row.status || '').toLowerCase()}`}>{row.status}</span></td>
                    <td className="spec-td-actions">
                      <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="action-btn view" title="View curriculum" aria-label="View curriculum" onClick={() => setViewRow(row)}>
                          <FiEye />
                        </button>
                        {isAdmin ? (
                          <>
                            <button type="button" className="action-btn edit" title="Edit curriculum" aria-label="Edit curriculum" onClick={() => openEdit(row)}>
                              <FiEdit2 />
                            </button>
                            {archived ? (
                              <button
                                type="button"
                                className="action-btn toggle curriculum-restore-btn"
                                onClick={() => handleRestore(row)}
                                disabled={restoreSubmittingId === row._id}
                                title="Restore curriculum"
                                aria-label="Restore curriculum"
                              >
                                <FiRotateCcw />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="action-btn delete"
                              onClick={() => openArchiveConfirm(row)}
                              disabled={archived}
                              title={archived ? 'Already archived' : 'Archive curriculum'}
                              aria-label="Archive curriculum"
                            >
                              <FiArchive />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              }) : null}
            </tbody>
          </table>
        </div>
        {filteredRows.length > PAGE_SIZE ? (
          <div className="pagination-controls">
            <div className="results-count-pagination" aria-label="Bottom pagination controls">
              <button
                className="pagination-btn pagination-btn-sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={!hasPrev}
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
                />
              </label>
              <span className="pagination-info pagination-info-sm">of {totalPages}</span>
              <button
                className="pagination-btn pagination-btn-sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={!hasNext}
                type="button"
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {viewRow ? (
        <div className="student-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="curriculum-view-title" onClick={() => setViewRow(null)}>
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">Curriculum</p>
                <h3 id="curriculum-view-title">{viewRow.courseCode} — {viewRow.courseTitle}</h3>
                <p className="modal-subtitle">
                  <span className={`status-badge status-${String(viewRow.status || '').toLowerCase()}`}>{viewRow.status}</span>
                  {' · '}
                  {viewRow.program}
                </p>
              </div>
              <div className="flex items-start gap-2">
                {isAdmin ? (
                  <>
                    <button
                      type="button"
                      className="modal-edit-btn"
                      onClick={() => {
                        const r = viewRow;
                        openEdit(r);
                      }}
                    >
                      <FiEdit2 />
                      <span>Edit</span>
                    </button>
                    {viewRow.status === 'Archived' ? (
                      <button
                        type="button"
                        className="modal-edit-btn"
                        onClick={() => handleRestore(viewRow)}
                        disabled={restoreSubmittingId === viewRow._id}
                      >
                        <FiRotateCcw />
                        <span>Restore</span>
                      </button>
                    ) : null}
                    {viewRow.status !== 'Archived' ? (
                      <button
                        type="button"
                        className="modal-edit-btn modal-delete-btn"
                        onClick={() => openArchiveConfirm(viewRow)}
                      >
                        <FiArchive />
                        <span>Archive</span>
                      </button>
                    ) : null}
                  </>
                ) : null}
                <button type="button" className="modal-close" onClick={() => setViewRow(null)} aria-label="Close">
                  <FiX />
                </button>
              </div>
            </div>
            <div className="profile-details-container">
              <div className="modal-grid">
                <div>
                  <p className="label">Course code</p>
                  <input className="readonly-field" type="text" value={viewRow.courseCode || '—'} readOnly />
                </div>
                <div>
                  <p className="label">Curriculum year</p>
                  <input className="readonly-field" type="text" value={viewRow.curriculumYear || '—'} readOnly />
                </div>
                <div>
                  <p className="label">Credit units</p>
                  <input className="readonly-field" type="text" value={String(viewRow.creditUnits ?? '—')} readOnly />
                </div>
                <div>
                  <p className="label">Lecture hours</p>
                  <input className="readonly-field" type="text" value={String(viewRow.lectureHours ?? 0)} readOnly />
                </div>
                <div>
                  <p className="label">Lab hours</p>
                  <input className="readonly-field" type="text" value={String(viewRow.labHours ?? 0)} readOnly />
                </div>
                <div>
                  <p className="label">Total contact hours</p>
                  <input
                    className="readonly-field"
                    type="text"
                    value={String(Number(viewRow.lectureHours || 0) + Number(viewRow.labHours || 0))}
                    readOnly
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p className="label">Description</p>
                  <textarea className="readonly-field" readOnly rows={3} value={String(viewRow.description || '').trim() || '—'} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p className="label">Prerequisites</p>
                  <input
                    className="readonly-field"
                    type="text"
                    readOnly
                    value={Array.isArray(viewRow.prerequisites) && viewRow.prerequisites.length ? viewRow.prerequisites.join(', ') : '—'}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p className="label">Course learning outcomes</p>
                  <textarea
                    className="readonly-field"
                    readOnly
                    rows={6}
                    value={
                      (viewRow.courseLearningOutcomes || []).filter(Boolean).length
                        ? (viewRow.courseLearningOutcomes || [])
                            .map((c, i) => `${i + 1}. ${String(c).trim()}`)
                            .join('\n')
                        : '—'
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {formModal && isAdmin ? <CurriculumFormModal mode={formModal.mode} initialData={formModal.data} options={activeCodes} onClose={() => setFormModal(null)} onSaved={handleSaved} /> : null}
      {deleteTarget ? (
        <div className="spec-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="curriculum-delete-title">
          <div className="spec-modal">
            <div className="spec-modal-header">
              <div>
                <p className="spec-modal-eyebrow">Archive curriculum</p>
                <h2 id="curriculum-delete-title" className="spec-modal-title">Archive this curriculum?</h2>
                <p className="spec-modal-sub">
                  This will set status to Archived and hide it from the default active view.
                </p>
              </div>
              <button type="button" className="spec-modal-close" onClick={() => setDeleteTarget(null)} disabled={deleteSubmitting}><FiX size={20} /></button>
            </div>
            <div className="spec-modal-body"><p><strong>{deleteTarget.courseCode}</strong> - {deleteTarget.courseTitle}</p></div>
            <div className="spec-modal-footer">
              <button type="button" className="spec-btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleteSubmitting}>Cancel</button>
              <button type="button" className="spec-btn-primary spec-btn-danger-solid" onClick={handleArchive} disabled={deleteSubmitting}>{deleteSubmitting ? 'Archiving...' : 'Archive'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}