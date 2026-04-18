import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiArchive, FiCalendar, FiClock, FiEdit2, FiEye, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import '../../students/routes/StudentInformation.css';
import '../../faculty/routes/SpecializationManagement.css';
import '../../instruction/routes/SyllabusPages.css';
import './TimeBlocksPage.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DURATION_PRESETS = [60, 90, 120, 180, 240];

function minutesFromHHmm(s) {
  if (!s || typeof s !== 'string') return null;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function hhmmFromMinutes(total) {
  const h = Math.floor(total / 60);
  const mi = total % 60;
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

function computeEndTimeDisplay(startTime, durationMinutes) {
  const start = minutesFromHHmm(startTime);
  if (start == null || !Number.isFinite(Number(durationMinutes))) {
    return { endTime: '', error: 'Enter a valid start time and duration.' };
  }
  const dur = Number(durationMinutes);
  if (!Number.isInteger(dur) || dur < 1) {
    return { endTime: '', error: 'Duration must be a positive whole number of minutes.' };
  }
  const end = start + dur;
  if (end > 24 * 60) {
    return {
      endTime: '',
      error: 'This combination crosses midnight. Use an earlier start or shorter duration for same-day slots.',
    };
  }
  return { endTime: hhmmFromMinutes(end), error: '' };
}

function formatDurationBadge(minutes) {
  const m = Number(minutes);
  if (!Number.isFinite(m)) return '—';
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h > 0 && r > 0) return `${h}h ${r}m`;
  if (h > 0) return `${h}h`;
  return `${r}m`;
}

function emptyForm() {
  return {
    label: '',
    startTime: '08:00',
    durationMinutes: 90,
    daysOfWeek: ['Mon', 'Wed', 'Fri'],
    curriculumId: '',
  };
}

function rowToForm(row) {
  return {
    label: row.label || '',
    startTime: row.startTime || '08:00',
    durationMinutes: Number(row.durationMinutes) || 60,
    daysOfWeek: Array.isArray(row.daysOfWeek) && row.daysOfWeek.length ? [...row.daysOfWeek] : ['Mon'],
    curriculumId: row.curriculumId && typeof row.curriculumId === 'object' ? row.curriculumId._id : row.curriculumId || '',
  };
}

function TimeBlockFormModal({ mode, initial, curricula, onClose, onSaved }) {
  const [form, setForm] = useState(() => (initial ? rowToForm(initial) : emptyForm()));
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(initial ? rowToForm(initial) : emptyForm());
    setErrors({});
    setApiError('');
  }, [initial, mode]);

  const endComputed = useMemo(
    () => computeEndTimeDisplay(form.startTime, form.durationMinutes),
    [form.startTime, form.durationMinutes],
  );

  const toggleDay = (day) => {
    setForm((prev) => {
      const has = prev.daysOfWeek.includes(day);
      const next = has ? prev.daysOfWeek.filter((d) => d !== day) : [...prev.daysOfWeek, day];
      return { ...prev, daysOfWeek: next.sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)) };
    });
  };

  const validate = () => {
    const next = {};
    if (!String(form.label || '').trim()) next.label = 'Label is required.';
    const dur = Number(form.durationMinutes);
    if (!Number.isInteger(dur) || dur < 1) next.durationMinutes = 'Duration must be a positive integer (minutes).';
    if (dur % 15 !== 0) {
      next.durationMinutes = 'Use multiples of 15 minutes (institutional grid).';
    }
    if (!form.daysOfWeek.length) next.daysOfWeek = 'Select at least one teaching day.';
    if (endComputed.error) next.startTime = endComputed.error;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const { endTime } = computeEndTimeDisplay(form.startTime, form.durationMinutes);
    setSubmitting(true);
    setApiError('');
    try {
      const curriculumId = String(form.curriculumId || '').trim();
      const body = {
        label: String(form.label || '').trim(),
        durationMinutes: Number(form.durationMinutes),
        daysOfWeek: form.daysOfWeek,
        startTime: form.startTime,
        endTime,
        curriculumId: curriculumId || null,
      };
      const isEdit = mode === 'edit' && initial?._id;
      const res = await apiFetch(isEdit ? `/api/scheduling/timeblocks/${initial._id}` : '/api/scheduling/timeblocks', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setApiError(data?.message || `Request failed (${res.status}).`);
        return;
      }
      toast.success(isEdit ? 'Time block updated.' : 'Time block created.');
      onSaved(data);
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spec-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="timeblock-modal-title">
      <div className="spec-modal spec-modal--wide timeblock-modal">
        <div className="spec-modal-header">
          <div>
            <p className="spec-modal-eyebrow">Scheduling</p>
            <h2 id="timeblock-modal-title" className="spec-modal-title">
              {mode === 'edit' ? 'Edit time block' : 'New time block'}
            </h2>
            <p className="spec-modal-sub">
              Start time and duration determine end time (same calendar day). Optional curriculum enforces weekly lecture/lab minute bounds.
            </p>
          </div>
          <button type="button" className="spec-modal-close" onClick={onClose} disabled={submitting}>
            <FiX size={20} />
          </button>
        </div>
        <form className="timeblock-modal-body" onSubmit={handleSubmit}>
          {apiError ? (
            <div className="spec-alert" role="alert">
              {apiError}
            </div>
          ) : null}
          <div className="timeblock-modal-layout">
            <div className="timeblock-modal-col timeblock-modal-col--main">
              <div className="form-field">
                <label className="form-label" htmlFor="tb-label">Label</label>
                <input
                  id="tb-label"
                  className={`form-input ${errors.label ? 'input-error' : ''}`}
                  value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder='e.g. "Standard Lecture - 1.5hr"'
                  autoComplete="off"
                />
                {errors.label ? <span className="field-error">{errors.label}</span> : null}
              </div>

              <div className="timeblock-time-grid">
                <div className="form-field">
                  <label className="form-label" htmlFor="tb-start">Start time</label>
                  <input
                    id="tb-start"
                    type="time"
                    step={900}
                    className={`form-input timeblock-time-input ${errors.startTime ? 'input-error' : ''}`}
                    value={form.startTime}
                    onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                  />
                  <p className="timeblock-field-hint">15-minute steps (institutional grid)</p>
                  {errors.startTime ? <span className="field-error">{errors.startTime}</span> : null}
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="tb-duration">Duration (minutes)</label>
                  <input
                    id="tb-duration"
                    type="number"
                    min={15}
                    step={15}
                    className={`form-input ${errors.durationMinutes ? 'input-error' : ''}`}
                    value={form.durationMinutes}
                    onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value === '' ? '' : Number(e.target.value) }))}
                  />
                  <div className="timeblock-presets" role="group" aria-label="Common durations">
                    {DURATION_PRESETS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`timeblock-preset-btn${Number(form.durationMinutes) === m ? ' timeblock-preset-btn--active' : ''}`}
                        onClick={() => setForm((p) => ({ ...p, durationMinutes: m }))}
                      >
                        {formatDurationBadge(m)}
                      </button>
                    ))}
                  </div>
                  {errors.durationMinutes ? <span className="field-error">{errors.durationMinutes}</span> : null}
                </div>
                <div className="form-field timeblock-end-field">
                  <span className="form-label">Computed end time</span>
                  <div className="timeblock-end-display" aria-live="polite">
                    <FiClock aria-hidden />
                    <strong>{endComputed.endTime || '—'}</strong>
                  </div>
                </div>
              </div>

              <fieldset className="timeblock-days-fieldset">
                <legend className="form-label">Active teaching days</legend>
                <div className="timeblock-day-chips">
                  {DAYS.map((day) => (
                    <label key={day} className={`timeblock-day-chip${form.daysOfWeek.includes(day) ? ' timeblock-day-chip--on' : ''}`}>
                      <input
                        type="checkbox"
                        className="timeblock-day-input"
                        checked={form.daysOfWeek.includes(day)}
                        onChange={() => toggleDay(day)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
                {errors.daysOfWeek ? <span className="field-error">{errors.daysOfWeek}</span> : null}
              </fieldset>
            </div>

            <div className="timeblock-modal-col timeblock-modal-col--side">
              <div className="form-field timeblock-curriculum-field">
                <label className="form-label" htmlFor="tb-curriculum">Curriculum (optional)</label>
                <select
                  id="tb-curriculum"
                  className="form-select timeblock-curriculum-select"
                  value={form.curriculumId}
                  onChange={(e) => setForm((p) => ({ ...p, curriculumId: e.target.value }))}
                >
                  <option value="">None — generic institutional block</option>
                  {curricula.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.courseCode} — {c.courseTitle} (lec {c.lectureHours ?? 0}h / lab {c.labHours ?? 0}h)
                    </option>
                  ))}
                </select>
                <p className="timeblock-field-hint">
                  When assigned, duration must fit within that curriculum&apos;s weekly lecture/lab minute totals from the catalog.
                </p>
              </div>
            </div>
          </div>

          <div className="spec-modal-footer timeblock-modal-footer">
            <button type="button" className="spec-btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="spec-btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TimeBlocksPage() {
  const [rows, setRows] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formModal, setFormModal] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const label = String(row.label || '').toLowerCase();
      const cc =
        row.curriculumId && typeof row.curriculumId === 'object'
          ? String(row.curriculumId.courseCode || '').toLowerCase()
          : '';
      const ct =
        row.curriculumId && typeof row.curriculumId === 'object'
          ? String(row.curriculumId.courseTitle || '').toLowerCase()
          : '';
      const slot = `${row.startTime || ''} ${row.endTime || ''}`.toLowerCase();
      return label.includes(q) || cc.includes(q) || ct.includes(q) || slot.includes(q);
    });
  }, [rows, search]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tbRes, curRes] = await Promise.all([
        apiFetch('/api/scheduling/timeblocks'),
        apiFetch('/api/curricula?status=Active'),
      ]);
      const tbJson = await tbRes.json().catch(() => null);
      const curJson = await curRes.json().catch(() => null);
      if (!tbRes.ok) {
        throw new Error(tbJson?.message || `Could not load time blocks (${tbRes.status}).`);
      }
      if (!curRes.ok) {
        throw new Error(curJson?.message || `Could not load curricula (${curRes.status}).`);
      }
      setRows(Array.isArray(tbJson) ? tbJson : []);
      setCurricula(Array.isArray(curJson) ? curJson : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openArchiveConfirm = (row) => {
    setViewRow(null);
    setDeleteTarget(row);
  };

  const handleSaved = (saved) => {
    setFormModal(null);
    setRows((prev) => {
      const idx = prev.findIndex((r) => String(r._id) === String(saved._id));
      if (idx === -1) return [...prev, saved].sort((a, b) => String(a.label).localeCompare(String(b.label)));
      const next = [...prev];
      next[idx] = saved;
      return next.sort((a, b) => String(a.label).localeCompare(String(b.label)));
    });
  };

  const handleArchive = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const res = await apiFetch(`/api/scheduling/timeblocks/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.message || 'Could not archive.');
        return;
      }
      toast.success('Time block archived.');
      setRows((prev) => prev.filter((r) => String(r._id) !== String(deleteTarget._id)));
      setDeleteTarget(null);
    } catch {
      toast.error('Network error.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="student-directory spec-page syllabi-page scheduling-registry-page">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiCalendar />
        </div>
        <div>
          <p className="directory-hero-title">Time block catalog</p>
          <p className="directory-hero-subtitle">
            <span>Define standard daily slots, durations, and teaching days so sections align with institutional hours.</span>
          </p>
        </div>
      </div>

      <div className="spec-card">
        <div className="spec-toolbar syllabus-toolbar">
          <div className="spec-toolbar-meta">
            <h2 className="spec-toolbar-title">Time blocks</h2>
            <p className="spec-toolbar-sub">Archive removes a block from scheduling picks (soft delete).</p>
          </div>
          <div className="spec-toolbar-right">
            {!loading ? (
              <div className="student-count-badge">
                <FiCalendar />
                <span>
                  {filteredRows.length} time block{filteredRows.length === 1 ? '' : 's'}
                </span>
              </div>
            ) : null}
            <div className="syllabus-toolbar-actions">
              <button type="button" className="spec-btn-primary" onClick={() => { setViewRow(null); setFormModal({ mode: 'create', data: null }); }}>
                <FiPlus />
                <span>Add time block</span>
              </button>
            </div>
          </div>
        </div>

        <div className="curriculum-filters-row syllabus-filters-row">
          <div className="search-box curriculum-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by label, curriculum code or title, or slot time"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {!loading ? (
          <div className="results-count">
            Showing <strong>{filteredRows.length}</strong> time block{filteredRows.length === 1 ? '' : 's'}
          </div>
        ) : null}

        {error ? <div className="spec-alert">{error}</div> : null}

        <div className="spec-table-wrap">
          <table className="spec-table syllabus-table scheduling-timeblocks-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Duration</th>
                <th>Slot</th>
                <th>Days</th>
                <th>Curriculum</th>
                <th className="spec-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="spec-loading">
                    Loading time blocks…
                  </td>
                </tr>
              ) : null}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="spec-empty">
                    No active time blocks yet. Create one to standardize slots.
                  </td>
                </tr>
              ) : null}
              {!loading && rows.length > 0 && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="spec-empty">
                    No time blocks match your search.
                  </td>
                </tr>
              ) : null}
              {!loading
                ? filteredRows.map((row) => (
                    <tr key={row._id} className="spec-table-row-clickable" onClick={() => setViewRow(row)}>
                      <td>
                        <span className="scheduling-tb-label scheduling-tb-label--accent">{row.label}</span>
                      </td>
                      <td>
                        <span className="scheduling-duration-value">{formatDurationBadge(row.durationMinutes)}</span>
                      </td>
                      <td>
                        <span className="scheduling-slot-text">
                          {row.startTime} – {row.endTime}
                        </span>
                      </td>
                      <td>
                        <div className="timeblock-day-chips timeblock-day-chips--readonly">
                          {(row.daysOfWeek || []).map((d) => (
                            <span key={d} className="timeblock-day-pill">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {row.curriculumId && typeof row.curriculumId === 'object' ? (
                          <>
                            <span className="scheduling-curr-code-chip">{row.curriculumId.courseCode}</span>
                            <span className="scheduling-curr-meta">
                              {row.curriculumId.courseTitle}
                              <span className="scheduling-curr-hours">
                                lec {row.curriculumId.lectureHours ?? 0}h / lab {row.curriculumId.labHours ?? 0}h
                              </span>
                            </span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="spec-td-actions">
                        <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="action-btn view"
                            title="View time block"
                            aria-label="View time block"
                            onClick={() => setViewRow(row)}
                          >
                            <FiEye />
                          </button>
                          <button
                            type="button"
                            className="action-btn edit"
                            title="Edit time block"
                            aria-label="Edit time block"
                            onClick={() => {
                              setViewRow(null);
                              setFormModal({ mode: 'edit', data: row });
                            }}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            type="button"
                            className="action-btn delete"
                            title="Archive time block"
                            aria-label="Archive time block"
                            onClick={() => openArchiveConfirm(row)}
                          >
                            <FiArchive />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      {viewRow ? (
        <div className="student-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="timeblock-view-title" onClick={() => setViewRow(null)}>
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">Time block</p>
                <h3 id="timeblock-view-title">{viewRow.label}</h3>
                <p className="modal-subtitle">
                  {viewRow.startTime} – {viewRow.endTime} · {formatDurationBadge(viewRow.durationMinutes)}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  className="modal-edit-btn"
                  onClick={() => {
                    const r = viewRow;
                    setViewRow(null);
                    setFormModal({ mode: 'edit', data: r });
                  }}
                >
                  <FiEdit2 />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="modal-edit-btn modal-delete-btn"
                  onClick={() => openArchiveConfirm(viewRow)}
                >
                  <FiArchive />
                  <span>Archive</span>
                </button>
                <button type="button" className="modal-close" onClick={() => setViewRow(null)} aria-label="Close">
                  <FiX />
                </button>
              </div>
            </div>
            <div className="profile-details-container">
              <div className="modal-grid">
                <div>
                  <p className="label">Label</p>
                  <input className="readonly-field" type="text" value={viewRow.label || '—'} readOnly />
                </div>
                <div>
                  <p className="label">Duration</p>
                  <input className="readonly-field" type="text" value={formatDurationBadge(viewRow.durationMinutes)} readOnly />
                </div>
                <div>
                  <p className="label">Slot</p>
                  <input className="readonly-field" type="text" value={`${viewRow.startTime || '—'} – ${viewRow.endTime || '—'}`} readOnly />
                </div>
              </div>
              <p className="label" style={{ marginTop: '1rem' }}>Teaching days</p>
              <div className="timeblock-day-chips timeblock-day-chips--readonly" style={{ marginTop: '0.35rem' }}>
                {(viewRow.daysOfWeek || []).map((d) => (
                  <span key={d} className="timeblock-day-pill">
                    {d}
                  </span>
                ))}
              </div>
              <div className="modal-grid" style={{ marginTop: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p className="label">Linked curriculum</p>
                  <input
                    className="readonly-field"
                    type="text"
                    readOnly
                    value={
                      viewRow.curriculumId && typeof viewRow.curriculumId === 'object'
                        ? `${viewRow.curriculumId.courseCode} — ${viewRow.curriculumId.courseTitle} (lec ${viewRow.curriculumId.lectureHours ?? 0}h / lab ${viewRow.curriculumId.labHours ?? 0}h)`
                        : 'None — generic institutional block'
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {formModal ? (
        <TimeBlockFormModal
          mode={formModal.mode}
          initial={formModal.data}
          curricula={curricula}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {deleteTarget ? (
        <div className="spec-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="timeblock-del-title">
          <div className="spec-modal">
            <div className="spec-modal-header">
              <div>
                <p className="spec-modal-eyebrow">Archive time block</p>
                <h2 id="timeblock-del-title" className="spec-modal-title">
                  Archive this configuration?
                </h2>
                <p className="spec-modal-sub">It will no longer appear in active lists. This is a soft delete.</p>
              </div>
              <button type="button" className="spec-modal-close" onClick={() => setDeleteTarget(null)} disabled={deleteBusy}>
                <FiX size={20} />
              </button>
            </div>
            <div className="spec-modal-body">
              <p>
                <strong>{deleteTarget.label}</strong>
              </p>
            </div>
            <div className="spec-modal-footer">
              <button type="button" className="spec-btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleteBusy}>
                Cancel
              </button>
              <button type="button" className="spec-btn-primary spec-btn-danger-solid" onClick={handleArchive} disabled={deleteBusy}>
                {deleteBusy ? 'Archiving…' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
