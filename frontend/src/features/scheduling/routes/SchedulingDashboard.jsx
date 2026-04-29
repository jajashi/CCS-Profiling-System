import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MasterScheduleMatrix from '../components/MasterScheduleMatrix';
import AssignResourcesModal from '../components/AssignResourcesModal';
import LevelUpWizardModal from '../components/LevelUpWizardModal';
import { apiFetch } from '../../../lib/api';
import { FiCalendar, FiGrid, FiLayers, FiArrowRight, FiActivity } from 'react-icons/fi';
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
  const [sections, setSections] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [matrixRefreshToken, setMatrixRefreshToken] = useState(0);

  const loadSchedulingData = useCallback(async () => {
    try {
      const sectionsRes = await apiFetch('/api/scheduling/sections?status=All');
      const sectionsData = await sectionsRes.json();
      if (Array.isArray(sectionsData)) {
        setSections(sectionsData);
        const terms = [...new Set(sectionsData.map(s => String(s.term || '').trim()).filter(Boolean))];
        const years = [...new Set(sectionsData.map(s => String(s.academicYear || '').trim()).filter(Boolean))];
        if (terms.length > 0) {
          setTermOptions(terms);
          setTerm((prev) => (prev && terms.includes(prev) ? prev : terms[0]));
        } else {
          setTerm('1st Term');
        }
        if (years.length > 0) {
          const sortedYears = years.sort((a, b) => b.localeCompare(a));
          setYearOptions(sortedYears);
          setAcademicYear((prev) => (prev && sortedYears.includes(prev) ? prev : sortedYears[0]));
        } else {
          setAcademicYear('2025-2026');
        }
      }
    } catch {
      setTerm('1st Term');
      setAcademicYear('2025-2026');
    }

    setLoadingResources(true);
    try {
      const [curRes, roomRes, facRes, tbRes] = await Promise.all([
        apiFetch("/api/curricula?status=Active"),
        apiFetch("/api/scheduling/rooms?status=Active"),
        apiFetch("/api/faculty?status=Active"),
        apiFetch("/api/scheduling/timeblocks"),
      ]);
      setCurricula(await curRes.json());
      setRooms(await roomRes.json());
      setFaculty(await facRes.json());
      setTimeBlocks(await tbRes.json());
    } catch (err) {
      console.error("Failed to load resources", err);
    } finally {
      setLoadingResources(false);
    }
  }, []);

  useEffect(() => {
    loadSchedulingData();
  }, [loadSchedulingData]);

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
          <button className="quick-action-link" onClick={() => setShowWizard(true)}>
            <FiActivity /> Lifecycle Wizard <FiArrowRight size={14} />
          </button>
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
            refreshToken={matrixRefreshToken}
          />
        </div>
      </div>

      {editSection && (
        <AssignResourcesModal
          section={editSection}
          onClose={() => setEditSection(null)}
          onUpdated={() => {
            setEditSection(null);
            setMatrixRefreshToken((n) => n + 1);
            loadSchedulingData();
          }}
          rooms={rooms}
          faculty={faculty}
          curricula={curricula}
          timeBlocks={timeBlocks}
        />
      )}

      {showWizard && (
        <LevelUpWizardModal
          sections={sections}
          onClose={() => setShowWizard(false)}
          onCompleted={() => {
            setMatrixRefreshToken((n) => n + 1);
            loadSchedulingData();
            setShowWizard(false);
          }}
        />
      )}
    </div>
  );
}
