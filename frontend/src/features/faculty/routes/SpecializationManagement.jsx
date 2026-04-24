import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiEdit2, FiEye, FiLayers, FiPlus, FiSearch, FiTrash2, FiX, } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import '../../students/routes/StudentInformation.css';
import './SpecializationManagement.css';

const FACULTY_DIRECTORY_PATH = '/dashboard/faculty/directory';
const PAGE_SIZE = 20;

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
  const [viewRow, setViewRow] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

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
    setViewRow(null);
    setModal({ mode: 'add', id: null });
    setFormName('');
    setFormDescription('');
    setModalError('');
  };

  const openEdit = (row) => {
    setViewRow(null);
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
    setViewRow(null);
    setDeleteTarget(row);
    setError('');
  };

  const openView = (row) => {
    setViewRow(row);
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

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => {
      const name = String(row.name || '').toLowerCase();
      const description = String(row.description || '').toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [rows, search]);

  const totalPages = Math.max(Math.ceil(filteredRows.length / PAGE_SIZE), 1);
  const paginatedRows = filteredRows.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setPageInput(String(page || 1));
  }, [page]);

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

      <div className="spec-card">
        <div className="spec-toolbar">
          <div className="search-box curriculum-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search specialization name or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="spec-toolbar-right">
            {!loading ? (
              <div className="student-count-badge">
                <FiLayers />
                <span>
                  {filteredRows.length} specialization{filteredRows.length === 1 ? '' : 's'}
                </span>
              </div>
            ) : null}
            <button type="button" onClick={openAdd} className="spec-btn-primary">
              <FiPlus aria-hidden />
              Add specialization
            </button>
          </div>
        </div>

        {!loading ? (
          <div className="results-count">
            <div className="results-count-text">
              Showing <strong>{filteredRows.length}</strong> specialization{filteredRows.length === 1 ? '' : 's'}
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
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="spec-empty">
                    No specializations matched your search.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const count = row.assignedCount ?? 0;
                  return (
                    <tr
                      key={row._id}
                      className="spec-table-row-clickable"
                      onClick={() => openView(row)}
                    >
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
                        <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openView(row)}
                            className="action-btn view"
                            title="View specialization"
                            aria-label="View specialization"
                          >
                            <FiEye size={16} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="action-btn edit"
                            title="Edit specialization"
                            aria-label="Edit specialization"
                          >
                            <FiEdit2 size={16} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(row)}
                            className="action-btn delete"
                            title="Delete specialization"
                            aria-label="Delete specialization"
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
        <div className="student-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="spec-view-title" onClick={() => setViewRow(null)}>
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">Specialization</p>
                <h3 id="spec-view-title">{viewRow.name}</h3>
                <p className="modal-subtitle">Catalog entry — {viewRow.assignedCount ?? 0} assigned faculty</p>
              </div>
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  className="modal-edit-btn"
                  onClick={() => {
                    const row = viewRow;
                    setViewRow(null);
                    openEdit(row);
                  }}
                >
                  <FiEdit2 />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="modal-edit-btn modal-delete-btn"
                  onClick={() => {
                    const row = viewRow;
                    setViewRow(null);
                    openDelete(row);
                  }}
                >
                  <FiTrash2 />
                  <span>Delete</span>
                </button>
                <button type="button" className="modal-close" onClick={() => setViewRow(null)} aria-label="Close">
                  <FiX />
                </button>
              </div>
            </div>
            <div className="profile-details-container">
              <div className="modal-grid">
                <div>
                  <p className="label">Name</p>
                  <input className="readonly-field" type="text" value={viewRow.name || '—'} readOnly />
                </div>
                <div>
                  <p className="label">Assigned faculty</p>
                  <input className="readonly-field" type="text" value={String(viewRow.assignedCount ?? 0)} readOnly />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p className="label">Description</p>
                  <textarea
                    className="readonly-field"
                    readOnly
                    rows={4}
                    value={String(viewRow.description || '').trim() || 'No description'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
