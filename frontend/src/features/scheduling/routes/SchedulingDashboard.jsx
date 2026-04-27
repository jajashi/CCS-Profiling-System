import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiGrid, FiLayers, FiArrowRight } from 'react-icons/fi';
import MasterScheduleMatrix from '../components/MasterScheduleMatrix';
import AssignResourcesModal from '../components/AssignResourcesModal';
import { apiFetch } from '../../../lib/api';
import toast from 'react-hot-toast';
import './SchedulingDashboard.css';

export default function SchedulingDashboard() {
  const [termOptions, setTermOptions] = useState(['1st Term', '2nd Term', 'Summer']);
  const [yearOptions, setYearOptions] = useState(['2024-2025', '2025-2026', '2026-2027']);
  const [term, setTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  
  const [editSection, setEditSection] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    apiFetch('/api/scheduling/sections?status=All')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const terms = [...new Set(data.map(s => String(s.term || '').trim()).filter(Boolean))];
          const years = [...new Set(data.map(s => String(s.academicYear || '').trim()).filter(Boolean))];
          if (terms.length > 0) {
            setTermOptions(terms);
            setTerm(terms[0]);
          } else {
            setTerm('1st Term');
          }
          if (years.length > 0) {
            setYearOptions(years.sort((a,b) => b.localeCompare(a)));
            setAcademicYear(years.sort((a,b) => b.localeCompare(a))[0]);
          } else {
            setAcademicYear('2025-2026');
          }
        }
      })
      .catch(() => {
        setTerm('1st Term');
        setAcademicYear('2025-2026');
      });

    // Pre-fetch resources for scheduling modal
    setLoadingResources(true);
    Promise.all([
      apiFetch("/api/curricula?status=Active"),
      apiFetch("/api/scheduling/rooms?status=Active"),
      apiFetch("/api/faculty?status=Active"),
      apiFetch("/api/scheduling/timeblocks"),
    ]).then(async ([curRes, roomRes, facRes, tbRes]) => {
      setCurricula(await curRes.json());
      setRooms(await roomRes.json());
      setFaculty(await facRes.json());
      setTimeBlocks(await tbRes.json());
    }).catch(err => {
      console.error("Failed to load resources", err);
    }).finally(() => {
      setLoadingResources(false);
    });
  }, []);

  const handleEditSection = useCallback(async (sectionId) => {
    try {
      const res = await apiFetch(`/api/scheduling/sections/${sectionId}`);
      if (!res.ok) throw new Error("Failed to fetch section details.");
      const data = await res.json();
      setEditSection(data);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  return (
    <div className="scheduling-dashboard-page">
      <div className="directory-hero faculty-hero scheduling-hero">
        <div className="directory-hero-icon">
          <FiCalendar />
        </div>
        <div>
          <p className="directory-hero-title">Scheduling Matrix</p>
          <p className="directory-hero-subtitle">
            <span>Master timetable view for sections, rooms, and faculty allocations.</span>
          </p>
        </div>
      </div>

      <div className="scheduling-dashboard-toolbar">
        <div className="dashboard-filters">
          <label htmlFor="sched-term">Term</label>
          <select id="sched-term" value={term} onChange={(e) => setTerm(e.target.value)}>
            {termOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <label htmlFor="sched-ay">Academic Year</label>
          <select id="sched-ay" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
             {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="quick-actions">
          <Link to="/dashboard/scheduling/sections" className="quick-action-link">
            <FiLayers /> Manage Sections <FiArrowRight size={14} />
          </Link>
          <Link to="/dashboard/scheduling/rooms" className="quick-action-link">
            <FiGrid /> Room Registry <FiArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="dashboard-section matrix-section">
        <h3>Master Schedule Matrix</h3>
        <div className="matrix-wrapper">
          <MasterScheduleMatrix 
            term={term} 
            academicYear={academicYear} 
            onEditSection={handleEditSection}
          />
        </div>
      </div>

      {editSection && (
        <AssignResourcesModal
          section={editSection}
          onClose={() => setEditSection(null)}
          onUpdated={() => {
            setEditSection(null);
            // Refresh matrix by triggering a state change if needed, 
            // but MasterScheduleMatrix already reacts to term/academicYear.
            // We might need a refresh key or just let the user toggle filters.
            window.location.reload(); // Simple refresh for now to ensure matrix updates
          }}
          rooms={rooms}
          faculty={faculty}
          curricula={curricula}
          timeBlocks={timeBlocks}
        />
      )}
    </div>
  );
}
