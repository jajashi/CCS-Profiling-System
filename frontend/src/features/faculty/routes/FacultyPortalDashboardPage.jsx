import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiCalendar, FiClock, FiUsers } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import FacultyActionLog from '../components/FacultyActionLog';
import '../../students/routes/StudentInformation.css';
import './FacultyPortalDashboardPage.css';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toMinutes(hhmm = '') {
  const [h, m] = String(hhmm).split(':').map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

function getTodayCode() {
  const idx = new Date().getDay();
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx];
}

function getWelcomeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function FacultyPortalDashboardPage() {
  const [classes, setClasses] = useState([]);
  const [scheduleRows, setScheduleRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, schedRes] = await Promise.all([
        apiFetch('/api/scheduling/my-classes'),
        apiFetch('/api/scheduling/my-schedule'),
      ]);
      const classesData = await classesRes.json().catch(() => []);
      const schedData = await schedRes.json().catch(() => []);
      if (!classesRes.ok) throw new Error('Failed');
      setClasses(Array.isArray(classesData) ? classesData : []);
      setScheduleRows(Array.isArray(schedData) ? schedData : []);
    } catch {
      setClasses([]);
      setScheduleRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalMinutes = scheduleRows.reduce((acc, row) => {
      const start = toMinutes(row.startTime);
      const end = toMinutes(row.endTime);
      return acc + Math.max(end - start, 0);
    }, 0);
    return {
      classes: classes.length,
      enrolled: classes.reduce((acc, r) => acc + Number(r.enrolledCount || 0), 0),
      scheduleHours: Number((totalMinutes / 60).toFixed(1)),
    };
  }, [classes, scheduleRows]);

  const todaySchedule = useMemo(() => {
    const todayCode = getTodayCode();
    return scheduleRows
      .filter((row) => String(row.dayOfWeek || '') === todayCode)
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  }, [scheduleRows]);

  const weeklySchedule = useMemo(() => {
    return [...scheduleRows]
      .sort((a, b) => {
        const dayDiff = DAY_ORDER.indexOf(String(a.dayOfWeek || '')) - DAY_ORDER.indexOf(String(b.dayOfWeek || ''));
        if (dayDiff !== 0) return dayDiff;
        return toMinutes(a.startTime) - toMinutes(b.startTime);
      })
      .slice(0, 8);
  }, [scheduleRows]);

  const weeklyLoadByDay = useMemo(() => {
    const totals = DAY_ORDER.map((day) => ({ day, minutes: 0 }));
    scheduleRows.forEach((row) => {
      const day = String(row.dayOfWeek || '');
      const idx = DAY_ORDER.indexOf(day);
      if (idx < 0) return;
      const duration = Math.max(toMinutes(row.endTime) - toMinutes(row.startTime), 0);
      totals[idx].minutes += duration;
    });
    const peakMinutes = totals.reduce((max, row) => Math.max(max, row.minutes), 0);
    return totals.map((row) => ({
      ...row,
      hours: Number((row.minutes / 60).toFixed(1)),
      widthPct: peakMinutes > 0 ? Math.max((row.minutes / peakMinutes) * 100, 6) : 0,
    }));
  }, [scheduleRows]);

  const nextClass = useMemo(() => {
    const now = new Date();
    const todayCode = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const upcomingToday = scheduleRows
      .filter((row) => String(row.dayOfWeek || '') === todayCode && toMinutes(row.startTime) >= nowMinutes)
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    if (upcomingToday.length) return upcomingToday[0];
    return null;
  }, [scheduleRows]);

  const welcomeGreeting = useMemo(() => getWelcomeGreeting(), []);
  const welcomeDate = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [],
  );

  return (
    <div className="student-directory spec-page faculty-dashboard">
      <div className="directory-hero faculty-hero faculty-dashboard__hero-banner">
        <div className="faculty-dashboard__hero-main">
          <div>
            <p className="faculty-dashboard__welcome-meta">{welcomeDate}</p>
            <p className="directory-hero-title">{welcomeGreeting}! Welcome to your dashboard.</p>
            <p className="directory-hero-subtitle">
              <span>Monitor your weekly load, schedule blocks, and recent activity.</span>
            </p>
          </div>
        </div>
      </div>

      <div className="faculty-dashboard__stats">
        <div className="faculty-dashboard__stat-card faculty-dashboard__stat-card--classes">
          <div className="faculty-dashboard__stat-icon faculty-dashboard__stat-icon--classes">
            <FiBookOpen />
          </div>
          <div className="faculty-dashboard__stat-details">
            <p className="faculty-dashboard__stat-label">Classes</p>
            <p className="faculty-dashboard__stat-value">{stats.classes}</p>
            <p className="faculty-dashboard__stat-sub">Active handled sections this term</p>
          </div>
        </div>
        <div className="faculty-dashboard__stat-card faculty-dashboard__stat-card--enrolled">
          <div className="faculty-dashboard__stat-icon faculty-dashboard__stat-icon--enrolled">
            <FiUsers />
          </div>
          <div className="faculty-dashboard__stat-details">
            <p className="faculty-dashboard__stat-label">Enrolled students</p>
            <p className="faculty-dashboard__stat-value">{stats.enrolled}</p>
            <p className="faculty-dashboard__stat-sub">Total learners across your classes</p>
          </div>
        </div>
        <div className="faculty-dashboard__stat-card faculty-dashboard__stat-card--load">
          <div className="faculty-dashboard__stat-icon faculty-dashboard__stat-icon--load">
            <FiClock />
          </div>
          <div className="faculty-dashboard__stat-details">
            <p className="faculty-dashboard__stat-label">Weekly load (hrs)</p>
            <p className="faculty-dashboard__stat-value">{stats.scheduleHours}</p>
            <p className="faculty-dashboard__stat-sub">Estimated contact hours this week</p>
          </div>
        </div>
        <div className="faculty-dashboard__stat-card faculty-dashboard__stat-card--today">
          <div className="faculty-dashboard__stat-icon faculty-dashboard__stat-icon--today">
            <FiCalendar />
          </div>
          <div className="faculty-dashboard__stat-details">
            <p className="faculty-dashboard__stat-label">Today classes</p>
            <p className="faculty-dashboard__stat-value">{todaySchedule.length}</p>
            <p className="faculty-dashboard__stat-sub">Scheduled meetings for today</p>
          </div>
        </div>
      </div>

      <div className="faculty-dashboard__panels">
        <section className="faculty-dashboard__panel faculty-dashboard__panel--load">
          <div className="faculty-dashboard__panel-head">
            <h3>Weekly Teaching Load</h3>
            <Link to="/dashboard/scheduling/my-schedule" className="faculty-dashboard__panel-link">Open full schedule</Link>
          </div>
          {weeklyLoadByDay.some((row) => row.minutes > 0) ? (
            <div className="faculty-dashboard__load-list">
              {weeklyLoadByDay.map((row) => (
                <div key={row.day} className="faculty-dashboard__load-row">
                  <span>{row.day}</span>
                  <div className="faculty-dashboard__load-bar-track">
                    <div className="faculty-dashboard__load-bar-fill" style={{ width: `${row.widthPct}%` }} />
                  </div>
                  <strong>{row.hours}h</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="faculty-dashboard__muted">No weekly schedule data available.</p>
          )}
        </section>

        <section className="faculty-dashboard__panel faculty-dashboard__panel--schedule">
          <div className="faculty-dashboard__panel-head">
            <h3>This Week Schedule</h3>
            <Link to="/dashboard/scheduling/my-schedule" className="faculty-dashboard__panel-link">Open full schedule</Link>
          </div>
          {weeklySchedule.length ? (
            <div className="faculty-dashboard__table-wrap">
              <table className="faculty-dashboard__table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Course</th>
                    <th>Section</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklySchedule.map((row, idx) => (
                    <tr key={`${row.sectionId || idx}-${row.dayOfWeek}-${row.startTime}`}>
                      <td>{row.dayOfWeek || '—'}</td>
                      <td>{row.startTime || '—'} - {row.endTime || '—'}</td>
                      <td>{row.courseCode || '—'}</td>
                      <td>{row.sectionIdentifier || '—'}</td>
                      <td>{row.roomName || 'TBA'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="faculty-dashboard__muted">No weekly schedule data available.</p>
          )}
        </section>
      </div>

      <FacultyActionLog />
      {loading ? <p className="faculty-dashboard__muted">Loading dashboard...</p> : null}
    </div>
  );
}
