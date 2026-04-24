import React, { useMemo, useState } from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';

const ATTENDANCE_STATUS = ['Present', 'Late', 'Absent'];

function AttendanceButtons({ value, onChange }) {
  const selected = value || 'Present';
  return (
    <div className="faculty-class-attendance__buttons" role="group" aria-label="Attendance status">
      {ATTENDANCE_STATUS.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`faculty-class-attendance__btn ${selected === opt ? 'is-active' : ''}`}
          onClick={() => onChange(opt)}
          aria-pressed={selected === opt}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function toCsv(rows) {
  const head = ['Student ID', 'Last Name', 'First Name', 'Program', 'Year', 'Email', 'Status', 'Attendance'];
  const lines = [head.join(',')];
  rows.forEach((r) => {
    const cols = [
      r.id || '',
      r.lastName || '',
      r.firstName || '',
      r.program || '',
      r.yearLevel || '',
      r.email || '',
      r.status || '',
      r.attendance || '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(cols.join(','));
  });
  return lines.join('\n');
}

export default function RosterAttendanceTable({
  students,
  records,
  onRecordChange,
  sessionDate,
  onRefresh,
  rightActions,
}) {
  const [query, setQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  const programs = useMemo(
    () => [...new Set(students.map((s) => String(s.program || '').trim()).filter(Boolean))].sort(),
    [students],
  );

  const filtered = useMemo(() => {
    const key = query.trim().toLowerCase();
    return students.filter((st) => {
      if (programFilter && String(st.program || '') !== programFilter) return false;
      if (!key) return true;
      const fullName = `${st.lastName || ''}, ${st.firstName || ''}`.toLowerCase();
      return (
        fullName.includes(key) ||
        String(st.id || '').toLowerCase().includes(key) ||
        String(st.email || '').toLowerCase().includes(key) ||
        String(st.program || '').toLowerCase().includes(key)
      );
    });
  }, [students, query, programFilter]);

  const rows = filtered;

  const exportCsv = () => {
    const payload = filtered.map((st) => ({
      ...st,
      attendance: records[st._id || st.id] || 'Present',
    }));
    const blob = new Blob([toCsv(payload)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-roster-${sessionDate || 'session'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 800);
  };

  return (
    <div>
      <div className="table-toolbar faculty-roster-toolbar">
        <div className="search-box">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder="Search by student, ID, email, or program"
            aria-label="Search students"
          />
        </div>
        <select
          className="filter-select curriculum-select"
          value={programFilter}
          onChange={(e) => {
            setProgramFilter(e.target.value);
          }}
        >
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button type="button" className="spec-btn-secondary" onClick={onRefresh}>
          <FiRefreshCw />
          <span>Refresh</span>
        </button>
      </div>

      <div className="faculty-roster-summary">
        <div className="results-count-text">
          Showing <strong>{rows.length}</strong> student{rows.length !== 1 ? 's' : ''}
        </div>
        <div className="faculty-roster-summary__actions">
          {rightActions}
          {/* <button type="button" className="spec-btn-secondary" onClick={exportCsv}>
            <FiDownload />
            <span>Export CSV</span>
          </button> */}
        </div>
      </div>

      <div className="faculty-class-students__table-wrap">
        <table className="faculty-class-students__table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Program</th>
              <th>Year</th>
              <th>Email</th>
              <th>Enrollment</th>
              <th>Attendance ({sessionDate})</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((st) => {
              const key = st._id || st.id;
              return (
                <tr key={key}>
                  <td>{st.id || '—'}</td>
                  <td>{`${st.lastName || ''}, ${st.firstName || ''}`.replace(/^,\s*/, '') || '—'}</td>
                  <td>{st.program || '—'}</td>
                  <td>{st.yearLevel || '—'}</td>
                  <td>{st.email || '—'}</td>
                  <td>{st.status || '—'}</td>
                  <td>
                    <AttendanceButtons value={records[key] || 'Present'} onChange={(v) => onRecordChange(key, v)} />
                  </td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr>
                <td colSpan={7} className="empty-row">No students matched current filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
