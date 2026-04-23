import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';

export default function FacultyActionLog() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch('/api/dashboard/activities');
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        setRows(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch {
        // keep non-blocking; activity log is supporting info
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="faculty-action-log">
      <h3 className="faculty-action-log__title">Faculty Activity Log</h3>
      {!rows.length ? (
        <p className="faculty-action-log__empty">No recent activity/actions yet.</p>
      ) : (
        <ul className="faculty-action-log__list">
          {rows.map((row) => (
            <li key={row._id} className="faculty-action-log__item">
              <strong>{row.action || 'Action'}</strong>
              <span>{row.module || 'Module'}</span>
              <span>{row.target || '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
