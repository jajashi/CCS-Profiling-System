import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit2,
  FiLayers,
  FiPlus,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import '../../students/routes/StudentInformation.css';
import './SpecializationManagement.css';

const FACULTY_DIRECTORY_PATH = '/dashboard/faculty/directory';

export default function SpecializationManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/specializations');
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setError(data?.message || 'Could not load specializations.');
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setModal({ mode: 'add', id: null });
    setFormName('');
    setFormDescription('');
    setModalError('');
  };

  const openEdit = (row) => {
    setModal({ mode: 'edit', id: row._id });
    setFormName(row.name || '');
    setFormDescription(String(row.description || ''));
    setModalError('');
  };

  const closeModal = () => {
    if (submitting) return;
    setModal(null);
    setFormName('');
    setFormDescription('');
    setModalError('');
  };

  const submitModal = async (e) => {
    e.preventDefault();
    const name = String(formName || '').trim();
    if (!name) {
      setModalError('Name is required.');
      return;
    }
    setModalError('');
    setSubmitting(true);
    try {
      const isEdit = modal?.mode === 'edit';
      const url = isEdit ? `/api/specializations/${modal.id}` : '/api/specializations';
      const res = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: formDescription }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        closeModal();
        await load();
        return;
      }
      setModalError(data?.message || `Request failed (${res.status}).`);
    } catch {
      setModalError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (row) => {
    setDeleteTarget(row);
    setError('');
  };

  const closeDelete = () => {
    if (deleteSubmitting) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    setError('');
    try {
      const res = await apiFetch(`/api/specializations/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        closeDelete();
        await load();
        return;
      }
      setError(data?.message || `Could not delete (${res.status}).`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="student-directory spec-page">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiLayers />
        </div>
        <div>
          <p className="directory-hero-title">Faculty specializations</p>
          <p className="directory-hero-subtitle">
            <span>Manage the catalog used in the directory, filters, and faculty profiles.</span>
          </p>
        </div>
      </div>

      <div className="spec-back-row">
        <Link to={FACULTY_DIRECTORY_PATH} className="spec-back-link">
          <FiArrowLeft aria-hidden />
          Back to faculty directory
        </Link>
      </div>

      <div className="spec-card">
        <div className="spec-toolbar">
          <div className="spec-toolbar-meta">
            <h2 className="spec-toolbar-title">Specialization catalog</h2>
            <p className="spec-toolbar-sub">
              {loading ? 'Loading…' : 'Deletion is blocked while a specialization is still assigned.'}
            </p>
            {!loading ? (
              <span className="spec-count-pill">
                {rows.length} total
              </span>
            ) : null}
          </div>
          <button type="button" onClick={openAdd} className="spec-btn-primary">
            <FiPlus aria-hidden />
            Add specialization
          </button>
        </div>

        {error ? (
          <div className="spec-alert" role="alert">
            {error}
          </div>
        ) : null}

        <div className="spec-table-wrap">
          <table className="spec-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Description</th>
                <th scope="col" className="spec-th-num">Assigned faculty</th>
                <th scope="col" className="spec-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="spec-loading">
                    Loading specializations…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="spec-empty">
                    No specializations yet. Use &quot;Add specialization&quot; to create the first entry.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const count = row.assignedCount ?? 0;
                  return (
                    <tr key={row._id}>
                      <td className="spec-name-cell">{row.name}</td>
                      <td
                        className={`spec-desc-cell ${String(row.description || '').trim() ? '' : 'is-empty'}`}
                      >
                        {String(row.description || '').trim() ? (
                          <span className="spec-desc-text" title={row.description}>
                            {row.description}
                          </span>
                        ) : (
                          <span className="spec-desc-text">No description</span>
                        )}
                      </td>
                      <td className="spec-td-num">
                        <span
                          className={`spec-assigned-badge ${count > 0 ? 'is-nonzero' : ''}`}
                        >
                          {count}
                        </span>
                      </td>
                      <td className="spec-td-actions">
                        <div className="spec-actions">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="spec-btn-ghost"
                            title="Edit specialization"
                          >
                            <FiEdit2 size={16} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(row)}
                            className="spec-btn-ghost spec-btn-danger"
                            title="Delete specialization"
                          >
                            <FiTrash2 size={16} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal ? (
        <div
          className="spec-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="spec-modal-title"
        >
          <div className="spec-modal spec-modal--wide">
            <div className="spec-modal-header">
              <div>
                <p className="spec-modal-eyebrow">Specializations</p>
                <h2 id="spec-modal-title" className="spec-modal-title">
                  {modal.mode === 'edit' ? 'Edit specialization' : 'Add specialization'}
                </h2>
                <p className="spec-modal-sub">
                  {modal.mode === 'edit'
                    ? 'Update the name or description. Assigned faculty keep this tag automatically.'
                    : 'Add a short name and an optional longer description for directory context.'}
                </p>
              </div>
              <button
                type="button"
                className="spec-modal-close"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={submitModal}>
              <div className="spec-modal-body">
                <label htmlFor="spec-name" className="spec-field-label">
                  Specialization name
                </label>
                <input
                  id="spec-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="spec-field-input"
                  placeholder="e.g. Software Development"
                  autoComplete="off"
                  disabled={submitting}
                  autoFocus
                />
                <label htmlFor="spec-description" className="spec-field-label spec-field-label--spaced">
                  Description
                </label>
                <textarea
                  id="spec-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="spec-field-textarea"
                  placeholder="What this specialization covers (teaching, research, or professional focus)."
                  maxLength={500}
                  disabled={submitting}
                  rows={4}
                />
                <p className="spec-field-hint">{formDescription.length} / 500 characters</p>
                {modalError ? (
                  <p className="spec-field-error" role="alert">
                    {modalError}
                  </p>
                ) : null}
              </div>
              <div className="spec-modal-footer">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="spec-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="spec-btn-primary"
                >
                  {submitting ? 'Saving…' : modal.mode === 'edit' ? 'Save changes' : 'Create specialization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="spec-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="spec-delete-title"
        >
          <div className="spec-modal">
            <div className="spec-modal-header">
              <div>
                <p className="spec-modal-eyebrow">Confirm deletion</p>
                <h2 id="spec-delete-title" className="spec-modal-title">
                  Remove this specialization?
                </h2>
                <p className="spec-modal-sub">
                  <span className="spec-delete-name">{deleteTarget.name}</span>
                  {' '}
                  will be removed from the catalog. This cannot be undone. If it is still assigned to
                  faculty, deletion will be rejected.
                </p>
              </div>
              <button
                type="button"
                className="spec-modal-close"
                onClick={closeDelete}
                disabled={deleteSubmitting}
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="spec-modal-footer">
              <button
                type="button"
                onClick={closeDelete}
                disabled={deleteSubmitting}
                className="spec-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteSubmitting}
                className="spec-btn-primary spec-btn-danger-solid"
              > 
                {deleteSubmitting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
