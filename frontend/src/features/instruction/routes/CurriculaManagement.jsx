import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiBookOpen, FiEdit2, FiPlus, FiRotateCcw, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import '../../students/routes/StudentInformation.css';
import '../../faculty/routes/SpecializationManagement.css';
import './CurriculaManagement.css';

const PROGRAM_OPTIONS = ['IT', 'CS', 'General'];
const STATUS_OPTIONS = ['Active', 'Archived', 'All'];
const COURSE_CODE_REGEX = /^[A-Z]{2,4}\d{3}$/;
const PAGE_SIZE = 50;

function emptyForm() {
  return {
    courseCode: '',
    courseTitle: '',
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
  const [prereqQuery, setPrereqQuery] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initialData ? { ...initialData } : emptyForm());
    setErrors({});
    setApiError('');
    setPrereqQuery('');
  }, [initialData]);

  const prerequisiteOptions = useMemo(() => {
    const currentCode = String(form.courseCode || '').trim().toUpperCase();
    return options
      .filter((code) => code !== currentCode)
      .filter((code) => code.toLowerCase().includes(prereqQuery.toLowerCase()));
  }, [options, form.courseCode, prereqQuery]);

  const validate = () => {
    const nextErrors = {};
    const code = String(form.courseCode || '').trim().toUpperCase();
    if (!COURSE_CODE_REGEX.test(code)) nextErrors.courseCode = 'Course code must match format like CS101 or ITC201.';
    if (!String(form.courseTitle || '').trim()) nextErrors.courseTitle = 'Course title is required.';
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
            <input id="courseCode" className="spec-field-input" value={form.courseCode} onChange={(e) => setForm((prev) => ({ ...prev, courseCode: e.target.value.toUpperCase() }))} disabled={submitting} />
            {errors.courseCode ? <p className="spec-field-error">{errors.courseCode}</p> : null}

            <label className="spec-field-label" htmlFor="courseTitle">Course title</label>
            <input id="courseTitle" className="spec-field-input" value={form.courseTitle} onChange={(e) => setForm((prev) => ({ ...prev, courseTitle: e.target.value }))} disabled={submitting} />
            {errors.courseTitle ? <p className="spec-field-error">{errors.courseTitle}</p> : null}

            <label className="spec-field-label" htmlFor="program">Program</label>
            <select id="program" className="spec-field-input" value={form.program} onChange={(e) => setForm((prev) => ({ ...prev, program: e.target.value }))} disabled={submitting}>
              {PROGRAM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            {errors.program ? <p className="spec-field-error">{errors.program}</p> : null}

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

            <label className="spec-field-label" htmlFor="prereq-search">Prerequisites</label>
            <input id="prereq-search" className="spec-field-input" placeholder="Search active course codes" value={prereqQuery} onChange={(e) => setPrereqQuery(e.target.value)} disabled={submitting} />
            <div className={`curriculum-prereq-box ${prerequisiteOptions.length === 0 ? 'curriculum-prereq-box--empty' : ''}`}>
              {prerequisiteOptions.map((code) => (
                <label key={code} className="curriculum-prereq-option">
                  <input type="checkbox" checked={form.prerequisites.includes(code)} onChange={() => togglePrerequisite(code)} disabled={submitting} />
                  <span>{code}</span>
                </label>
              ))}
              {prerequisiteOptions.length === 0 ? <p className="curriculum-muted">No matching active course codes yet.</p> : null}
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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [page, setPage] = useState(1);
  const [formModal, setFormModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [restoreSubmittingId, setRestoreSubmittingId] = useState('');
  const [activeCodes, setActiveCodes] = useState([]);

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
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'All') params.set('status', statusFilter);
      else if (statusFilter === 'All') params.set('status', 'All');
      if (programFilter && programFilter !== 'All') params.set('program', programFilter);
      const queryString = params.toString();
      const res = await apiFetch(`/api/curricula${queryString ? `?${queryString}` : ''}`);
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setError(data?.message || `Could not load curricula (${res.status}).`);
        setRows([]);
        return;
      }
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setError('Network error. Please try again.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [programFilter, statusFilter]);

  useEffect(() => { loadCurricula(); }, [loadCurricula]);
  useEffect(() => { loadActiveCodes(); }, [loadActiveCodes]);
  useEffect(() => { setPage(1); }, [search, programFilter, statusFilter]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => String(row.courseCode || '').toLowerCase().includes(term) || String(row.courseTitle || '').toLowerCase().includes(term));
  }, [rows, search]);

  const totalPages = Math.max(Math.ceil(filteredRows.length / PAGE_SIZE), 1);
  const paginatedRows = useMemo(() => filteredRows.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE), [filteredRows, page]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const openEdit = (row) => {
    setFormModal({
      mode: 'edit',
      data: {
        _id: row._id,
        courseCode: row.courseCode || '',
        courseTitle: row.courseTitle || '',
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
    if (!row?._id) return;
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
            <span>Manage course frameworks for IT, CS, and institution-wide General subjects.</span>
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
            {!loading ? (
              <span className="spec-count-pill">
                {filteredRows.length} total
              </span>
            ) : null}
          </div>
          <button type="button" className="spec-btn-primary" onClick={() => setFormModal({ mode: 'create', data: emptyForm() })}>
            <FiPlus />
            <span>Add curriculum</span>
          </button>
        </div>

        <div className="curriculum-filters-row">
          <div className="search-box curriculum-search">
            <FiSearch />
            <input type="text" placeholder="Search by course code or title" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="filter-select curriculum-select" value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
            <option value="All">All Programs</option>
            {PROGRAM_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select className="filter-select curriculum-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>

        {error ? <div className="spec-alert">{error}</div> : null}

        <div className="spec-table-wrap">
          <table className="spec-table curriculum-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Program</th>
                <th>Credit Units</th>
                <th>Total Hours</th>
                <th>Status</th>
                <th className="spec-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="spec-loading">Loading curricula...</td></tr> : null}
              {!loading && paginatedRows.length === 0 ? <tr><td colSpan={7} className="spec-empty">No curricula found.</td></tr> : null}
              {!loading ? paginatedRows.map((row) => {
                const archived = row.status === 'Archived';
                return (
                  <tr key={row._id} className={archived ? 'row-inactive' : ''}>
                    <td><span className={`id-badge ${archived ? 'curriculum-archived-badge' : ''}`}>{row.courseCode}</span></td>
                    <td className={archived ? 'faculty-directory-name-inactive' : ''}>{row.courseTitle}</td>
                    <td>{row.program}</td>
                    <td>{row.creditUnits}</td>
                    <td>{Number(row.lectureHours || 0) + Number(row.labHours || 0)}</td>
                    <td><span className={`status-badge status-${String(row.status || '').toLowerCase()}`}>{row.status}</span></td>
                    <td className="spec-td-actions">
                      <div className="spec-actions">
                        <button type="button" className="spec-btn-ghost" onClick={() => openEdit(row)}><FiEdit2 /></button>
                        {archived ? (
                          <button
                            type="button"
                            className="spec-btn-ghost curriculum-restore-btn"
                            onClick={() => handleRestore(row)}
                            disabled={restoreSubmittingId === row._id}
                            title="Restore curriculum"
                          >
                            <FiRotateCcw />
                          </button>
                        ) : null}
                        <button type="button" className="spec-btn-ghost spec-btn-danger" onClick={() => setDeleteTarget(row)} disabled={archived} title={archived ? 'Already archived' : 'Archive curriculum'}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : null}
            </tbody>
          </table>
        </div>
        {filteredRows.length > PAGE_SIZE ? <div className="table-pagination"><button type="button" className="pagination-btn" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>Previous</button><span className="pagination-meta">Page {page} of {totalPages}</span><button type="button" className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Next</button></div> : null}
      </div>

      {formModal ? <CurriculumFormModal mode={formModal.mode} initialData={formModal.data} options={activeCodes} onClose={() => setFormModal(null)} onSaved={handleSaved} /> : null}
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