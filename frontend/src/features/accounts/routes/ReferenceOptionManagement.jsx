import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import './ReferenceOptionManagement.css';

export default function ReferenceOptionManagement() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  
  // New option form
  const [newOpt, setNewOpt] = useState({ category: 'Skill', value: '', label: '' });
  const [creating, setCreating] = useState(false);

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/reference-options/admin');
      if (res.ok) {
        const data = await res.json();
        setOptions(data);
      } else {
        setError('Failed to load options.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newOpt.value || !newOpt.label) return;
    setCreating(true);
    setError('');
    try {
      const res = await apiFetch('/api/reference-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOpt),
      });
      if (res.ok) {
        setNotice('Option added.');
        setNewOpt({ ...newOpt, value: '', label: '' });
        fetchOptions();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create option.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      const res = await apiFetch(`/api/reference-options/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        fetchOptions();
      }
    } catch {
      setError('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this option?')) return;
    try {
      const res = await apiFetch(`/api/reference-options/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotice('Option deleted.');
        fetchOptions();
      }
    } catch {
      setError('Failed to delete option.');
    }
  };

  const categories = ['Skill', 'Violation'];

  return (
    <div className="option-mgmt-page">
      <div className="directory-hero faculty-hero">
        <div className="directory-hero-icon">
          <FiSave />
        </div>
        <div>
          <p className="directory-hero-title">Reference Options</p>
          <p className="directory-hero-subtitle">
            Manage dynamic dropdown and checkbox options for Skills and Violations.
          </p>
        </div>
      </div>

      {notice && <div className="option-notice"><FiCheckCircle /> {notice}</div>}
      {error && <div className="option-error"><FiAlertCircle /> {error}</div>}

      <div className="option-grid">
        <section className="option-card add-card">
          <h3>Add New Option</h3>
          <form onSubmit={handleCreate} className="option-form">
            <div className="form-group">
              <label>Category</label>
              <select 
                value={newOpt.category} 
                onChange={(e) => setNewOpt({...newOpt, category: e.target.value})}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Internal Value (e.g. web-dev)</label>
              <input 
                type="text" 
                value={newOpt.value} 
                onChange={(e) => setNewOpt({...newOpt, value: e.target.value})}
                placeholder="Unique identifier"
                required
              />
            </div>
            <div className="form-group">
              <label>Display Label (e.g. Web Development)</label>
              <input 
                type="text" 
                value={newOpt.label} 
                onChange={(e) => setNewOpt({...newOpt, label: e.target.value})}
                placeholder="User friendly name"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={creating}>
              <FiPlus /> {creating ? 'Adding...' : 'Add Option'}
            </button>
          </form>
        </section>

        <section className="option-card list-card">
          <h3>Existing Options</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="option-table-wrap">
              <table className="option-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Label</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((opt) => (
                    <tr key={opt._id}>
                      <td><span className={`cat-pill ${opt.category.toLowerCase()}`}>{opt.category}</span></td>
                      <td>{opt.label}</td>
                      <td>
                        <button 
                          className={`status-toggle ${opt.isActive ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleActive(opt._id, opt.isActive)}
                        >
                          {opt.isActive ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td>
                        <button className="btn-icon danger" onClick={() => handleDelete(opt._id)}>
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {options.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-4">No options found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
