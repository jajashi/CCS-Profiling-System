import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiKey, FiRefreshCw, FiSearch, FiShield, FiTrash2, FiUserPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import './AccountManagementPage.css';

function normalizePayloadError(data, fallback) {
  return data?.message || fallback;
}

export default function AccountManagementPage() {
  const PAGE_SIZE = 20;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ withAccount: 0, withoutAccount: 0, active: 0, inactive: 0, mustChange: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [accountStateFilter, setAccountStateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [passwordFilter, setPasswordFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [adminForm, setAdminForm] = useState({ username: '', name: '' });
  const [adminCreating, setAdminCreating] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminModalError, setAdminModalError] = useState('');
  const [provisionBusyId, setProvisionBusyId] = useState('');

  const [resetBusyId, setResetBusyId] = useState('');
  const [statusBusyId, setStatusBusyId] = useState('');
  const [deleteBusyId, setDeleteBusyId] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const latestLoadTokenRef = useRef(0);

  const loadRows = useCallback(async () => {
    const loadToken = Date.now();
    latestLoadTokenRef.current = loadToken;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (accountStateFilter !== 'all') params.set('accountState', accountStateFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (passwordFilter !== 'all') params.set('passwordState', passwordFilter);
      params.set('page', String(currentPage));
      params.set('limit', String(PAGE_SIZE));
      let path = '/api/accounts';
      if (activeTab === 'students') path = '/api/accounts/profiles/students';
      if (activeTab === 'faculty') path = '/api/accounts/profiles/faculty';
      if (activeTab === 'admin') {
        params.set('role', 'admin');
        path = '/api/accounts';
      }
      const query = params.toString();
      const res = await apiFetch(`${path}${query ? `?${query}` : ''}`);
      const data = await res.json().catch(() => []);
      if (latestLoadTokenRef.current !== loadToken) return;
      if (!res.ok) {
        setError(normalizePayloadError(data, `Failed to load list (${res.status}).`));
        setRows([]);
        setTotalRows(0);
        setCurrentPage(1);
        setTotalPages(1);
        setSummary({ withAccount: 0, withoutAccount: 0, active: 0, inactive: 0, mustChange: 0 });
        return;
      }
      // Support both new paginated shape and older array-only responses.
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      const pagination = data?.pagination && typeof data.pagination === 'object' ? data.pagination : null;
      const hasServerPagination =
        Number.isFinite(data?.totalPages) ||
        Number.isFinite(data?.currentPage) ||
        Number.isFinite(data?.total) ||
        Number.isFinite(pagination?.totalPages) ||
        Number.isFinite(pagination?.page) ||
        Number.isFinite(pagination?.total);

      if (hasServerPagination) {
        const responseTotal = Number.isFinite(data?.total)
          ? data.total
          : Number.isFinite(pagination?.total)
            ? pagination.total
            : items.length;
        const responsePage = Number.isFinite(data?.currentPage)
          ? data.currentPage
          : Number.isFinite(pagination?.page)
            ? pagination.page
            : 1;
        const responseTotalPages = Number.isFinite(data?.totalPages)
          ? data.totalPages
          : Number.isFinite(pagination?.totalPages)
            ? pagination.totalPages
            : Math.max(Math.ceil(responseTotal / PAGE_SIZE), 1);

        setRows(items);
        setTotalRows(responseTotal);
        setCurrentPage(responsePage);
        setTotalPages(responseTotalPages);
      } else {
        // Backward compatibility for older API responses that return full arrays.
        const allItems = items;
        const computedTotal = allItems.length;
        const computedTotalPages = Math.max(Math.ceil(computedTotal / PAGE_SIZE), 1);
        const safePage = Math.min(Math.max(currentPage, 1), computedTotalPages);
        const start = (safePage - 1) * PAGE_SIZE;
        const pagedItems = allItems.slice(start, start + PAGE_SIZE);

        setRows(pagedItems);
        setTotalRows(computedTotal);
        setCurrentPage(safePage);
        setTotalPages(computedTotalPages);
      }
      if (data?.summary && typeof data.summary === 'object') {
        setSummary(data.summary);
      } else {
        const withAccount = items.filter((r) => Boolean(r.hasAccount || r.id)).length;
        const withoutAccount = items.length - withAccount;
        const active = items.filter((r) => {
          const hasAccount = Boolean(r.hasAccount || r.id);
          const isActive = r.account?.isActive ?? r.isActive;
          return hasAccount && isActive === true;
        }).length;
        const inactive = items.filter((r) => {
          const hasAccount = Boolean(r.hasAccount || r.id);
          const isActive = r.account?.isActive ?? r.isActive;
          return hasAccount && isActive === false;
        }).length;
        const mustChange = items.filter((r) => {
          const hasAccount = Boolean(r.hasAccount || r.id);
          const mustChangePassword = r.account?.mustChangePassword ?? r.mustChangePassword;
          return hasAccount && mustChangePassword === true;
        }).length;
        setSummary({ withAccount, withoutAccount, active, inactive, mustChange });
      }
    } catch {
      if (latestLoadTokenRef.current !== loadToken) return;
      setError('Network error while loading list.');
      setRows([]);
      setTotalRows(0);
      setCurrentPage(1);
      setTotalPages(1);
      setSummary({ withAccount: 0, withoutAccount: 0, active: 0, inactive: 0, mustChange: 0 });
    } finally {
      if (latestLoadTokenRef.current === loadToken) {
        setLoading(false);
      }
    }
  }, [activeTab, debouncedSearch, accountStateFilter, statusFilter, passwordFilter, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRows();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadRows]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setAccountStateFilter('all');
    setStatusFilter('all');
    setPasswordFilter('all');
    setSearch('');
    setDebouncedSearch('');
    setCurrentPage(1);
    setIsAdminModalOpen(false);
    setAdminModalError('');
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, accountStateFilter, statusFilter, passwordFilter]);

  useEffect(() => {
    setPageInput(String(currentPage || 1));
  }, [currentPage]);

  const provisionFromProfile = async (row) => {
    const profileId = String(row.profileId || '').trim();
    if (!profileId) return;
    setProvisionBusyId(profileId);
    setError('');
    try {
      const endpoint =
        activeTab === 'faculty'
          ? `/api/accounts/provision/faculty/${encodeURIComponent(profileId)}`
          : `/api/accounts/provision/student/${encodeURIComponent(profileId)}`;
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(normalizePayloadError(data, 'Could not create account.'));
        return;
      }
      setNotice(
        `Account created: ${data?.user?.username}. Temporary password: ${data?.temporaryPassword || ''} (birthday MMDDYYYY).`,
      );
      await loadRows();
    } catch {
      setError('Network error while creating account.');
    } finally {
      setProvisionBusyId('');
    }
  };

  const handleResetPassword = async (accountId) => {
    setResetBusyId(accountId);
    setError('');
    try {
      const res = await apiFetch(`/api/accounts/${encodeURIComponent(accountId)}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(normalizePayloadError(data, 'Could not reset password.'));
        return;
      }
      setNotice(
        `Password reset for ${data?.user?.username || 'account'}. Temporary password: ${data?.temporaryPassword || ''} (birthday MMDDYYYY).`,
      );
      await loadRows();
    } catch {
      setError('Network error while resetting password.');
    } finally {
      setResetBusyId('');
    }
  };

  const handleToggleStatus = async (accountId, nextIsActive) => {
    setStatusBusyId(accountId);
    setError('');
    try {
      const res = await apiFetch(`/api/accounts/${encodeURIComponent(accountId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextIsActive }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(normalizePayloadError(data, 'Could not update account status.'));
        return;
      }
      setNotice(`Account ${data?.user?.username || ''} is now ${nextIsActive ? 'active' : 'inactive'}.`);
      await loadRows();
    } catch {
      setError('Network error while updating account status.');
    } finally {
      setStatusBusyId('');
    }
  };

  const handleDeleteAccount = async (accountId, row) => {
    const username = row?.account?.username || row?.username || '';
    const accountName = username || 'this account';
    const token = `DELETE ${accountName}`;
    if (deleteConfirmInput.trim() !== token) {
      setError(`Type "${token}" to confirm account deletion.`);
      return;
    }

    setDeleteBusyId(accountId);
    setError('');
    try {
      const res = await apiFetch(`/api/accounts/${encodeURIComponent(accountId)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(normalizePayloadError(data, 'Could not delete account.'));
        return;
      }
      setNotice(`Account ${accountName} was deleted.`);
      setDeleteConfirm(null);
      setDeleteConfirmInput('');
      await loadRows();
    } catch {
      setError('Network error while deleting account.');
    } finally {
      setDeleteBusyId('');
    }
  };

  const createAdmin = async () => {
    const username = String(adminForm.username || '').trim();
    const name = String(adminForm.name || '').trim();
    if (!username || !name) {
      setAdminModalError('All fields are required.');
      return;
    }
    setAdminCreating(true);
    setAdminModalError('');
    try {
      const res = await apiFetch('/api/accounts/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setAdminModalError(normalizePayloadError(data, 'Could not create admin account.'));
        return;
      }
      setNotice(`Admin account created: ${data?.user?.username}. Temporary password is the username.`);
      setAdminForm({ username: '', name: '' });
      setIsAdminModalOpen(false);
      setAdminModalError('');
      await loadRows();
    } catch {
      setAdminModalError('Network error while creating admin account.');
    } finally {
      setAdminCreating(false);
    }
  };

  const activeAdminCount = useMemo(() => {
    if (activeTab !== 'admin') return 0;
    return summary.active || 0;
  }, [activeTab, summary.active]);

  const handlePageJump = () => {
    const parsed = Number.parseInt(String(pageInput || '').trim(), 10);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(currentPage || 1));
      return;
    }
    const nextPage = Math.min(Math.max(parsed, 1), Math.max(totalPages || 1, 1));
    setPageInput(String(nextPage));
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
  };

  return (
    <div className="account-page">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiShield />
        </div>
        <div>
          <p className="directory-hero-title">Account Management</p>
          <p className="directory-hero-subtitle">
            Create, activate, deactivate, and reset passwords directly from profile lists.
          </p>
        </div>
      </div>

      <div className="account-tabs">
        <button type="button" className={activeTab === 'admin' ? 'is-active' : ''} onClick={() => setActiveTab('admin')}>Admin</button>
        <button type="button" className={activeTab === 'students' ? 'is-active' : ''} onClick={() => setActiveTab('students')}>Students</button>
        <button type="button" className={activeTab === 'faculty' ? 'is-active' : ''} onClick={() => setActiveTab('faculty')}>Faculty</button>
      </div>

      {notice ? <div className="account-notice">{notice}</div> : null}
      {error ? <div className="account-error">{error}</div> : null}

      <section className="account-card">
        <div className="account-controls">
          <div className="account-toolbar account-controls-top">
            <div className="account-search">
              <FiSearch />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeTab === 'admin' ? 'Search admin username or name' : 'Search ID or name'}
              />
            </div>
            <select
              className="account-filter-select"
              value={accountStateFilter}
              onChange={(e) => setAccountStateFilter(e.target.value)}
              title="Filter by account presence"
            >
              <option value="all">All accounts</option>
              <option value="with-account">With account</option>
              {activeTab !== 'admin' ? <option value="without-account">Without account</option> : null}
            </select>
            <select
              className="account-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Filter by account status"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              className="account-filter-select"
              value={passwordFilter}
              onChange={(e) => setPasswordFilter(e.target.value)}
              title="Filter by password state"
            >
              <option value="all">All passwords</option>
              <option value="must-change">Must change</option>
              <option value="updated">Updated</option>
            </select>
            {activeTab === 'admin' ? (
              <button
                type="button"
                className="account-admin-create-btn"
                onClick={() => {
                  setAdminModalError('');
                  setIsAdminModalOpen(true);
                }}
              >
                <FiUserPlus />
                Create Admin
              </button>
            ) : null}
          </div>

          <div className="account-summary-bar account-controls-bottom">
            <div className="account-results-text" aria-label="Account results summary">
              Showing <strong>{rows.length}</strong> of <strong>{totalRows}</strong>
              <span className="account-results-sep">|</span>
              With account: <strong>{summary.withAccount}</strong>
              <span className="account-results-sep">|</span>
              No account: <strong>{summary.withoutAccount}</strong>
            </div>
            {totalPages > 1 ? (
              <div className="account-pagination account-pagination-top">
                <button
                  className="account-pagination-btn account-pagination-btn-sm"
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || loading}
                  aria-label="Previous page"
                >
                  <FiChevronLeft />
                </button>
                <label className="account-pagination-input-wrap" aria-label="Top page number">
                  <span className="account-pagination-input-label">Page</span>
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
                    className="account-pagination-page-input"
                    disabled={loading}
                  />
                </label>
                <span className="account-pagination-info-sm">of {totalPages}</span>
                <button
                  className="account-pagination-btn account-pagination-btn-sm"
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || loading}
                  aria-label="Next page"
                >
                  <FiChevronRight />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="account-table-wrap">
          <table className="account-table">
            <thead>
              <tr>
                <th>{activeTab === 'faculty' ? 'Employee ID' : activeTab === 'students' ? 'Student ID' : 'Username'}</th>
                <th>Name</th>
                <th>Login Username</th>
                <th>Status</th>
                <th>Password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="account-empty">Loading records...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="account-empty">No records found for selected filters.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id || row.profileId}>
                    {(() => {
                      const hasAccount = Boolean(row.account || row.id);
                      const canOpenProfile = activeTab === 'students' || activeTab === 'faculty';
                      const profileRoute =
                        activeTab === 'students'
                          ? `/dashboard/student-info/${encodeURIComponent(String(row.profileId || ''))}`
                          : activeTab === 'faculty'
                            ? `/dashboard/faculty/directory/${encodeURIComponent(String(row.profileId || ''))}`
                            : '';
                      const isActive = row.account?.isActive ?? row.isActive;
                      const mustChangePassword = row.account?.mustChangePassword ?? row.mustChangePassword;
                      const statusLabel = !hasAccount ? 'No account' : isActive ? 'Active' : 'Inactive';
                      const statusClass = !hasAccount
                        ? 'account-pill warn'
                        : isActive
                          ? 'account-pill active'
                          : 'account-pill inactive';
                      const passwordLabel = !hasAccount ? '—' : mustChangePassword ? 'Must Change' : 'Updated';
                      const passwordClass = !hasAccount
                        ? 'account-pill warn'
                        : mustChangePassword
                          ? 'account-pill warn'
                          : 'account-pill ok';
                      return (
                        <>
                    <td>
                      {canOpenProfile && row.profileId ? (
                        <button
                          type="button"
                          className="account-id-link"
                          onClick={() => navigate(profileRoute)}
                          title={`Open ${activeTab === 'students' ? 'student' : 'faculty'} profile`}
                        >
                          {row.profileId}
                        </button>
                      ) : (
                        row.profileId || row.username
                      )}
                    </td>
                    <td>{row.name || '-'}</td>
                    <td>{row.account?.username || row.username || '-'}</td>
                    <td>
                      <span className={statusClass}>
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      <span className={passwordClass}>
                        {passwordLabel}
                      </span>
                    </td>
                    <td>
                      <div className="account-actions">
                        {!row.account && !row.id ? (
                          <button
                            type="button"
                            onClick={() => provisionFromProfile(row)}
                            disabled={provisionBusyId === row.profileId}
                            title="Create login account"
                          >
                            <FiUserPlus />
                            {provisionBusyId === row.profileId ? 'Creating...' : 'Create Account'}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResetPassword(row.account?.id || row.id)}
                              disabled={resetBusyId === (row.account?.id || row.id)}
                              title="Reset password"
                            >
                              <FiKey />
                              {resetBusyId === (row.account?.id || row.id) ? 'Resetting...' : 'Reset Password'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const currentIsActive = row.account?.isActive ?? row.isActive;
                                const nextIsActive = !currentIsActive;
                                handleToggleStatus(row.account?.id || row.id, nextIsActive);
                              }}
                              disabled={
                                statusBusyId === (row.account?.id || row.id) ||
                                (activeTab === 'admin' &&
                                  row.role === 'admin' &&
                                  (row.account?.isActive ?? row.isActive) &&
                                  activeAdminCount <= 1)
                              }
                              title={
                                activeTab === 'admin' &&
                                row.role === 'admin' &&
                                (row.account?.isActive ?? row.isActive) &&
                                activeAdminCount <= 1
                                  ? 'At least one active admin is required.'
                                  : (row.account?.isActive ?? row.isActive)
                                    ? 'Deactivate account'
                                    : 'Activate account'
                              }
                            >
                              <FiRefreshCw />
                              {statusBusyId === (row.account?.id || row.id)
                                ? 'Saving...'
                                : (row.account?.isActive ?? row.isActive)
                                  ? 'Deactivate'
                                  : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirm(row);
                                setDeleteConfirmInput('');
                                setError('');
                              }}
                              disabled={deleteBusyId === (row.account?.id || row.id)}
                              title="Delete account"
                            >
                              <FiTrash2 />
                              {deleteBusyId === (row.account?.id || row.id) ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                        </>
                      );
                    })()}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="account-pagination account-pagination-bottom">
            <button
              className="account-pagination-btn account-pagination-btn-sm"
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              aria-label="Previous page"
            >
              <FiChevronLeft />
            </button>
            <label className="account-pagination-input-wrap" aria-label="Bottom page number">
              <span className="account-pagination-input-label">Page</span>
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
                className="account-pagination-page-input"
                disabled={loading}
              />
            </label>
            <span className="account-pagination-info-sm">of {totalPages}</span>
            <button
              className="account-pagination-btn account-pagination-btn-sm"
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              aria-label="Next page"
            >
              <FiChevronRight />
            </button>
          </div>
        ) : null}
      </section>
      {deleteConfirm ? (
        <div className="account-delete-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
          <div className="account-delete-modal">
            <h3 id="delete-account-title">Confirm account deletion</h3>
            <p>
              This action is permanent. Type
              <strong>{` DELETE ${deleteConfirm.account?.username || deleteConfirm.username || 'this account'}`}</strong>
              {' '}to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder={`DELETE ${deleteConfirm.account?.username || deleteConfirm.username || 'this account'}`}
              autoFocus
            />
            <div className="account-delete-modal-actions">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteConfirmInput('');
                }}
                disabled={Boolean(deleteBusyId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => handleDeleteAccount(deleteConfirm.account?.id || deleteConfirm.id, deleteConfirm)}
                disabled={deleteBusyId === (deleteConfirm.account?.id || deleteConfirm.id)}
              >
                {deleteBusyId === (deleteConfirm.account?.id || deleteConfirm.id) ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isAdminModalOpen ? (
        <div className="account-admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-admin-title">
          <div className="account-admin-modal">
            <h3 id="create-admin-title">Create admin account</h3>
            <p>Set up a new administrator login. This account will be required to change password on first sign in.</p>
            <p className="account-admin-modal-hint">Temporary password will be the username.</p>
            <div className="account-admin-form">
              <input
                type="text"
                placeholder="Username"
                value={adminForm.username}
                onChange={(e) => setAdminForm((p) => ({ ...p, username: e.target.value }))}
                disabled={adminCreating}
              />
              <input
                type="text"
                placeholder="Full name"
                value={adminForm.name}
                onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))}
                disabled={adminCreating}
              />
            </div>
            {adminModalError ? <div className="account-admin-modal-error">{adminModalError}</div> : null}
            <div className="account-admin-modal-actions">
              <button
                type="button"
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setAdminModalError('');
                  setAdminForm({ username: '', name: '' });
                }}
                disabled={adminCreating}
              >
                Cancel
              </button>
              <button type="button" className="primary" onClick={createAdmin} disabled={adminCreating}>
                {adminCreating ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
