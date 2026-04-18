import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiEdit2, FiEye, FiHome, FiPlus, FiRefreshCw, FiSearch, FiTool, FiX } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import '../../students/routes/StudentInformation.css';
import '../../faculty/routes/SpecializationManagement.css';
import '../../instruction/routes/SyllabusPages.css';
import './RoomsPage.css';

const ROOM_TYPES = ['Lecture', 'IT Lab', 'Biology Lab', 'Multipurpose'];
const ROOM_STATUSES = ['Active', 'Maintenance', 'Archived'];
const BUILDING_OPTIONS = ['Main Building', 'BCH', 'Nursing Building'];

function buildingSelectOptions(currentBuilding) {
  const cur = String(currentBuilding || '').trim();
  if (cur && !BUILDING_OPTIONS.includes(cur)) {
    return [cur, ...BUILDING_OPTIONS];
  }
  return BUILDING_OPTIONS;
}

function emptyForm() {
  return {
    roomCode: '',
    name: '',
    type: 'Lecture',
    maximumCapacity: 40,
    building: '',
    status: 'Active',
  };
}

function roomToForm(row) {
  return {
    roomCode: row.roomCode || '',
    name: row.name || '',
    type: row.type || 'Lecture',
    maximumCapacity: row.maximumCapacity ?? 40,
    building: row.building || '',
    status: row.status || 'Active',
  };
}

function RoomFormModal({ mode, initial, onClose, onSaved }) {
  const [form, setForm] = useState(() => (initial ? roomToForm(initial) : emptyForm()));
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const buildingOptions = useMemo(() => buildingSelectOptions(form.building), [form.building]);

  useEffect(() => {
    setForm(initial ? roomToForm(initial) : emptyForm());
    setErrors({});
    setApiError('');
  }, [initial, mode]);

  const validate = () => {
    const next = {};
    if (!String(form.roomCode || '').trim()) next.roomCode = 'Room code is required.';
    if (!String(form.name || '').trim()) next.name = 'Name is required.';
    if (!ROOM_TYPES.includes(form.type)) next.type = 'Select a valid room type.';
    const cap = Number(form.maximumCapacity);
    if (!Number.isInteger(cap) || cap < 1) next.maximumCapacity = 'Capacity must be an integer ≥ 1.';
    if (!String(form.building || '').trim()) next.building = 'Select a building.';
    if (!ROOM_STATUSES.includes(form.status)) next.status = 'Invalid status.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError('');
    try {
      const body = {
        roomCode: String(form.roomCode || '').trim(),
        name: String(form.name || '').trim(),
        type: form.type,
        maximumCapacity: Number(form.maximumCapacity),
        building: String(form.building || '').trim(),
        status: form.status,
      };
      const isEdit = mode === 'edit' && initial?._id;
      const res = await apiFetch(isEdit ? `/api/scheduling/rooms/${initial._id}` : '/api/scheduling/rooms', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setApiError(data?.message || `Request failed (${res.status}).`);
        return;
      }
      toast.success(isEdit ? 'Room updated.' : 'Room registered.');
      onSaved(data);
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spec-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="room-modal-title">
      <div className="spec-modal spec-modal--wide rooms-modal">
        <div className="spec-modal-header">
          <div>
            <p className="spec-modal-eyebrow">Room registry</p>
            <h2 id="room-modal-title" className="spec-modal-title">
              {mode === 'edit' ? 'Edit room' : 'Register room'}
            </h2>
            <p className="spec-modal-sub">Codes are unique; capacity is indexed for scheduling conflict checks.</p>
          </div>
          <button type="button" className="spec-modal-close" onClick={onClose} disabled={submitting}>
            <FiX size={20} />
          </button>
        </div>
        <form className="rooms-modal-body" onSubmit={handleSubmit}>
          {apiError ? <div className="spec-alert">{apiError}</div> : null}
          <div className="form-grid form-grid--two">
            <div className="form-field">
              <label className="form-label" htmlFor="room-code">Room code</label>
              <input
                id="room-code"
                className={`form-input ${errors.roomCode ? 'input-error' : ''}`}
                value={form.roomCode}
                onChange={(e) => setForm((p) => ({ ...p, roomCode: e.target.value }))}
                placeholder="e.g. IT-301"
                autoComplete="off"
                disabled={mode === 'edit'}
              />
              {errors.roomCode ? <span className="field-error">{errors.roomCode}</span> : null}
              {mode === 'edit' ? <p className="rooms-field-hint">Room code cannot be changed after creation.</p> : null}
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="room-name">Name</label>
              <input
                id="room-name"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              {errors.name ? <span className="field-error">{errors.name}</span> : null}
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="room-type">Type</label>
              <select
                id="room-type"
                className={`form-select ${errors.type ? 'input-error' : ''}`}
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.type ? <span className="field-error">{errors.type}</span> : null}
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="room-cap">Maximum capacity</label>
              <input
                id="room-cap"
                type="number"
                min={1}
                step={1}
                className={`form-input ${errors.maximumCapacity ? 'input-error' : ''}`}
                value={form.maximumCapacity}
                onChange={(e) => setForm((p) => ({ ...p, maximumCapacity: e.target.value === '' ? '' : Number(e.target.value) }))}
              />
              {errors.maximumCapacity ? <span className="field-error">{errors.maximumCapacity}</span> : null}
            </div>
            <div className="form-field form-grid--span-2">
              <label className="form-label" htmlFor="room-building">Building</label>
              <select
                id="room-building"
                className={`form-select ${errors.building ? 'input-error' : ''}`}
                value={form.building}
                onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))}
              >
                <option value="">Select building…</option>
                {buildingOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {errors.building ? <span className="field-error">{errors.building}</span> : null}
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="room-status">Status</label>
              <select
                id="room-status"
                className={`form-select ${errors.status ? 'input-error' : ''}`}
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                {ROOM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.status ? <span className="field-error">{errors.status}</span> : null}
            </div>
          </div>
          <div className="spec-modal-footer rooms-modal-footer">
            <button type="button" className="spec-btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="spec-btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : mode === 'edit' ? 'Save' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formModal, setFormModal] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [toggleBusyId, setToggleBusyId] = useState(null);
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const code = String(r.roomCode || '').toLowerCase();
      const name = String(r.name || '').toLowerCase();
      const b = String(r.building || '').toLowerCase();
      const typ = String(r.type || '').toLowerCase();
      return code.includes(q) || name.includes(q) || b.includes(q) || typ.includes(q);
    });
  }, [rows, search]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (typeFilter !== 'All') p.set('type', typeFilter);
    if (statusFilter !== 'All') p.set('status', statusFilter);
    const q = p.toString();
    return q ? `?${q}` : '';
  }, [typeFilter, statusFilter]);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/scheduling/rooms${queryString}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || `Could not load rooms (${res.status}).`);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!viewRow?._id) return;
    const next = rows.find((r) => String(r._id) === String(viewRow._id));
    if (next) setViewRow(next);
    else setViewRow(null);
  }, [rows, viewRow?._id]);

  const handleSaved = (saved) => {
    setFormModal(null);
    setRows((prev) => {
      const idx = prev.findIndex((r) => String(r._id) === String(saved._id));
      if (idx === -1) return [...prev, saved].sort((a, b) => String(a.roomCode).localeCompare(String(b.roomCode)));
      const next = [...prev];
      next[idx] = saved;
      return next.sort((a, b) => String(a.roomCode).localeCompare(String(b.roomCode)));
    });
  };

  const quickToggleMaintenance = async (row) => {
    if (row.status === 'Archived') return;
    const nextStatus = row.status === 'Active' ? 'Maintenance' : 'Active';
    setToggleBusyId(row._id);
    try {
      const res = await apiFetch(`/api/scheduling/rooms/${row._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.message || 'Update failed.');
        return;
      }
      toast.success(nextStatus === 'Maintenance' ? 'Room set to Maintenance — excluded from active picks.' : 'Room marked Active.');
      setRows((prev) => prev.map((r) => (String(r._id) === String(data._id) ? data : r)));
    } catch {
      toast.error('Network error.');
    } finally {
      setToggleBusyId(null);
    }
  };

  return (
    <div className="student-directory spec-page syllabi-page scheduling-registry-page">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiTool />
        </div>
        <div>
          <p className="directory-hero-title">Room registry</p>
          <p className="directory-hero-subtitle">
            <span>
              Classrooms and labs with indexed capacity for scheduling. Set Maintenance to exclude a room from active pickers.
            </span>
          </p>
        </div>
      </div>

      <div className="spec-card">
        <div className="spec-toolbar syllabus-toolbar">
          <div className="spec-toolbar-meta">
            <h2 className="spec-toolbar-title">Rooms &amp; laboratories</h2>
            <p className="spec-toolbar-sub">Filter by type and status; search by code, name, or building.</p>
          </div>
          <div className="spec-toolbar-right">
            {!loading ? (
              <div className="student-count-badge">
                <FiHome />
                <span>
                  {filteredRows.length} room{filteredRows.length === 1 ? '' : 's'}
                </span>
              </div>
            ) : null}
            <div className="syllabus-toolbar-actions">
              <button type="button" className="spec-btn-secondary" onClick={loadRooms} disabled={loading} title="Refresh list">
                <FiRefreshCw />
                <span>Refresh</span>
              </button>
              <button type="button" className="spec-btn-primary" onClick={() => { setViewRow(null); setFormModal({ mode: 'create', data: null }); }}>
                <FiPlus />
                <span>Register room</span>
              </button>
            </div>
          </div>
        </div>

        <div className="curriculum-filters-row syllabus-filters-row">
          <div className="search-box curriculum-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by room code, name, building, or type"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
            />
          </div>
          <select className="filter-select curriculum-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} disabled={loading}>
            <option value="All">All types</option>
            {ROOM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select className="filter-select curriculum-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} disabled={loading}>
            <option value="All">All statuses</option>
            {ROOM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {!loading ? (
          <div className="results-count">
            Showing <strong>{filteredRows.length}</strong> room{filteredRows.length === 1 ? '' : 's'}
          </div>
        ) : null}

        {error ? <div className="spec-alert">{error}</div> : null}

        <div className="spec-table-wrap">
          <table className="spec-table syllabus-table scheduling-rooms-table">
            <thead>
              <tr>
                <th>Room code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Building</th>
                <th className="scheduling-th-cap">Max capacity</th>
                <th>Status</th>
                <th className="spec-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="spec-loading">
                    Loading rooms…
                  </td>
                </tr>
              ) : null}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="spec-empty">
                    No rooms match these filters.
                  </td>
                </tr>
              ) : null}
              {!loading && rows.length > 0 && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="spec-empty">
                    No rooms match your search.
                  </td>
                </tr>
              ) : null}
              {!loading
                ? filteredRows.map((row) => {
                    const busy = toggleBusyId === row._id;
                    const canQuick = row.status === 'Active' || row.status === 'Maintenance';
                    const archived = row.status === 'Archived';
                    return (
                      <tr
                        key={row._id}
                        className={`${archived ? 'row-inactive' : ''} spec-table-row-clickable`.trim()}
                        onClick={() => setViewRow(row)}
                      >
                        <td>
                          <span className="id-badge">{row.roomCode}</span>
                        </td>
                        <td className={archived ? 'faculty-directory-name-inactive' : ''}>{row.name}</td>
                        <td>{row.type}</td>
                        <td>{row.building}</td>
                        <td className="scheduling-capacity-cell">
                          <span className="scheduling-room-cap">{row.maximumCapacity}</span>
                          <span className="scheduling-room-cap-label">seats max</span>
                        </td>
                        <td>
                          <span className={`status-badge status-${String(row.status || '').toLowerCase()}`}>{row.status}</span>
                        </td>
                        <td className="spec-td-actions">
                          <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="action-btn view"
                              title="View room"
                              aria-label="View room"
                              onClick={() => setViewRow(row)}
                            >
                              <FiEye />
                            </button>
                            {canQuick ? (
                              <button
                                type="button"
                                className={
                                  row.status === 'Active'
                                    ? 'rooms-quick-toggle rooms-quick-toggle--maintenance'
                                    : 'rooms-quick-toggle rooms-quick-toggle--active'
                                }
                                disabled={busy}
                                onClick={() => quickToggleMaintenance(row)}
                                title={
                                  row.status === 'Active'
                                    ? 'Set to Maintenance (hidden from active room pickers)'
                                    : 'Return to Active'
                                }
                                aria-label={
                                  row.status === 'Active' ? 'Set room to maintenance' : 'Mark room as active'
                                }
                              >
                                {busy ? (
                                  <span className="rooms-quick-toggle-busy">…</span>
                                ) : row.status === 'Active' ? (
                                  <>
                                    <FiTool aria-hidden />
                                    <span>Maintenance</span>
                                  </>
                                ) : (
                                  <>
                                    <FiCheckCircle aria-hidden />
                                    <span>Mark as active</span>
                                  </>
                                )}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="action-btn edit"
                              title="Edit room"
                              aria-label="Edit room"
                              onClick={() => {
                                setViewRow(null);
                                setFormModal({ mode: 'edit', data: row });
                              }}
                            >
                              <FiEdit2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
        </div>
      </div>

      {viewRow ? (
        <div className="student-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="room-view-title" onClick={() => setViewRow(null)}>
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">Room</p>
                <h3 id="room-view-title">{viewRow.name}</h3>
                <p className="modal-subtitle">
                  <span className="id-badge">{viewRow.roomCode}</span>
                  {' · '}
                  <span className={`status-badge status-${String(viewRow.status || '').toLowerCase()}`}>{viewRow.status}</span>
                </p>
              </div>
              <div className="flex items-start gap-2 flex-wrap justify-end" style={{ maxWidth: '100%' }}>
                {viewRow.status === 'Active' || viewRow.status === 'Maintenance' ? (
                  <button
                    type="button"
                    className={
                      viewRow.status === 'Active'
                        ? 'rooms-quick-toggle rooms-quick-toggle--maintenance'
                        : 'rooms-quick-toggle rooms-quick-toggle--active'
                    }
                    disabled={toggleBusyId === viewRow._id}
                    onClick={() => quickToggleMaintenance(viewRow)}
                  >
                    {toggleBusyId === viewRow._id ? (
                      <span className="rooms-quick-toggle-busy">…</span>
                    ) : viewRow.status === 'Active' ? (
                      <>
                        <FiTool aria-hidden />
                        <span>Maintenance</span>
                      </>
                    ) : (
                      <>
                        <FiCheckCircle aria-hidden />
                        <span>Mark as active</span>
                      </>
                    )}
                  </button>
                ) : null}
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
                <button type="button" className="modal-close" onClick={() => setViewRow(null)} aria-label="Close">
                  <FiX />
                </button>
              </div>
            </div>
            <div className="profile-details-container">
              <div className="modal-grid">
                <div>
                  <p className="label">Room code</p>
                  <input className="readonly-field" type="text" value={viewRow.roomCode || '—'} readOnly />
                </div>
                <div>
                  <p className="label">Name</p>
                  <input className="readonly-field" type="text" value={viewRow.name || '—'} readOnly />
                </div>
                <div>
                  <p className="label">Type</p>
                  <input className="readonly-field" type="text" value={viewRow.type || '—'} readOnly />
                </div>
                <div>
                  <p className="label">Building</p>
                  <input className="readonly-field" type="text" value={viewRow.building || '—'} readOnly />
                </div>
                <div>
                  <p className="label">Maximum capacity</p>
                  <input className="readonly-field" type="text" value={String(viewRow.maximumCapacity ?? '—')} readOnly />
                </div>
                <div>
                  <p className="label">Status</p>
                  <input className="readonly-field" type="text" value={viewRow.status || '—'} readOnly />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {formModal ? (
        <RoomFormModal mode={formModal.mode} initial={formModal.data} onClose={() => setFormModal(null)} onSaved={handleSaved} />
      ) : null}
    </div>
  );
}
