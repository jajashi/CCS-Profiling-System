import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthContext';
import './LoginPage.css';
import ccsHeadSrc from '../../../assets/images/ccs-head.png';
import ccsLogoSrc from '../../../assets/images/ccs-logo.jpg';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(username, password);

    if (result.success) {
      if (result.user?.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
      setPassword(''); // clear password field on failure
    }
  };

  return (
    <div className="login-page">
      <div className="login-page-brand">
        <div className="login-page-brand-inner" aria-hidden="true">
          <div className="login-brand-deco login-brand-deco--1" />
          <div className="login-brand-deco login-brand-deco--2" />
          <div className="login-brand-deco login-brand-deco--3" />
        </div>
        <div className="login-page-brand-logo">
          <img
            src={ccsLogoSrc}
            alt="College of Computing Studies logo"
            className="login-brand-logo-img"
          />
        </div>
      </div>

      <div className="login-page-panel">
        <div className="login-panel-card">
          <div className="login-panel-header">
            <img
              src={ccsHeadSrc}
              alt="CCS-PROFILING — College of Computing Studies Profiling System"
              className="login-head-img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className="login-context-pill">User login</span>
            <p className="login-panel-sub">Sign in with your institutional account to open the dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form login-form--pinnacle">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {error ? <div className="auth-error" role="alert">{error}</div> : null}

            <button type="submit" className="login-submit-btn">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
