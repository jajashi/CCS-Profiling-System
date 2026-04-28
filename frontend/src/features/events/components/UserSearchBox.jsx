import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiUser } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import './UserSearchBox.css';

export default function UserSearchBox({ onSelect, placeholder = "Search by name or ID...", excludeIds = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await apiFetch(`/api/accounts/search?q=${encodeURIComponent(query)}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          // Filter out excluded IDs
          const filtered = data.filter(u => !excludeIds.includes(u.id));
          setResults(filtered);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('User search error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, excludeIds]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (user) => {
    onSelect(user);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="user-search-container" ref={containerRef}>
      <div className="user-search-input-wrap">
        <FiSearch className="search-icon" />
        <input
          type="text"
          className="user-search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        {query && (
          <button type="button" className="clear-btn" onClick={() => setQuery('')}>
            <FiX />
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || loading) && (
        <div className="user-search-results">
          {loading ? (
            <div className="search-status">Searching...</div>
          ) : results.length > 0 ? (
            results.map((u) => (
              <div key={u.id} className="search-result-item" onClick={() => handleSelect(u)}>
                <div className="result-avatar">
                  <FiUser />
                </div>
                <div className="result-info">
                  <span className="result-name">{u.name}</span>
                  <span className="result-meta">
                    {u.role.toUpperCase()} • {u.studentId || u.employeeId || u.username}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="search-status">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
