import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import './PasswordRequestPage.css';

export default function PasswordRequestPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await apiFetch('/api/password-change/my-requests');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch request history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/password-change/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
        setNewPassword('');
        setConfirmPassword('');
        fetchHistory();
      } else {
        setError(data.message || 'Failed to submit request.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="password-request-page">
      <div className="password-request-card">
        <h2>Request Password Change</h2>
        <p>
          Submit a request to change your password. Your request will be reviewed by an administrator.
          Once approved, your new password will be applied automatically.
        </p>

        <form onSubmit={handleSubmit} className="password-request-form">
          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="At least 8 characters"
          />

          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <div className="password-request-error">{error}</div>}
          {success && <div className="password-request-success">{success}</div>}

          <button type="submit" className="password-request-submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      <div className="request-history">
        <h3>Request History</h3>
        {loadingHistory ? (
          <p>Loading history...</p>
        ) : history.length === 0 ? (
          <p>No password change requests found.</p>
        ) : (
          <table className="request-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Admin Notes</th>
              </tr>
            </thead>
            <tbody>
              {history.map((req) => (
                <tr key={req._id}>
                  <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-pill ${req.status.toLowerCase()}`}>
                      {req.status}
                    </span>
                  </td>
                  <td>{req.adminNotes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
