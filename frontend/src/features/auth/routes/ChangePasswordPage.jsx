import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthContext';
import './ChangePasswordPage.css';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { changePassword, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    const result = await changePassword(currentPassword, newPassword);
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'Could not change password.');
      return;
    }

    if (result.showWelcome) {
      sessionStorage.setItem(
        'ccs_show_welcome_modal',
        JSON.stringify({
          name: user?.name || '',
          role: user?.role || '',
        }),
      );
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="change-password-page">
      <div className="change-password-card">
        <h1>Change Your Password</h1>
        <p>
          Welcome{user?.name ? `, ${user.name}` : ''}. You must change your temporary password before
          accessing the portal.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="currentPassword">Current password</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <div className="change-password-hints">
            <span className={hasMinLength ? 'ok' : ''}>At least 8 characters</span>
            <span className={hasUpper ? 'ok' : ''}>One uppercase letter</span>
            <span className={hasNumber ? 'ok' : ''}>One number</span>
          </div>

          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          {error ? <div className="change-password-error">{error}</div> : null}

          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
