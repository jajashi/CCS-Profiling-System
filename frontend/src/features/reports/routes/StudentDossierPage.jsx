import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiUser, FiCalendar, FiBook, FiMapPin, FiAlertTriangle, FiAward, FiLoader } from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import toast from 'react-hot-toast';
import './ReportsPage.css'; // Reuse some styles

const StudentDossierPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const res = await apiFetch(`/api/reports/students/${id}/dossier`);
        if (!res.ok) throw new Error('Failed to load student dossier');
        const data = await res.json();
        setDossier(data);
      } catch (error) {
        toast.error(error.message);
        navigate('/dashboard/reports');
      } finally {
        setLoading(false);
      }
    };
    fetchDossier();
  }, [id, navigate]);

  const handleExportPDF = async () => {
    try {
      const res = await apiFetch(`/api/reports/students/${id}/export`);
      if (!res.ok) throw new Error('Failed to generate PDF');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Dossier_${dossier.lastName}_${dossier.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="dossier-loading">
        <FiLoader className="animate-spin" />
        <p>Assembling 360-degree student view...</p>
      </div>
    );
  }

  if (!dossier) return null;

  return (
    <div className="dossier-page">
      <div className="dossier-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back to Reports
        </button>
        <button className="spec-btn-primary" onClick={handleExportPDF}>
          <FiDownload /> Export PDF Dossier
        </button>
      </div>

      <div className="dossier-content">
        <div className="dossier-sidebar">
          <div className="dossier-profile-card">
            <div className="dossier-avatar-large">
              {dossier.profileAvatar ? (
                <img src={dossier.profileAvatar} alt={dossier.firstName} />
              ) : (
                <span>{dossier.firstName[0]}{dossier.lastName[0]}</span>
              )}
            </div>
            <h2 className="dossier-name">{dossier.firstName} {dossier.lastName}</h2>
            <p className="dossier-id">{dossier.id}</p>
            <div className={`status-badge status-${dossier.status?.toLowerCase()}`}>
              {dossier.status}
            </div>
          </div>

          <div className="dossier-info-group">
            <h4 className="group-title">Placement</h4>
            <div className="info-item">
              <span className="info-label">Program</span>
              <span className="info-value">{dossier.program}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Year Level</span>
              <span className="info-value">{dossier.yearLevel}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Section</span>
              <span className="info-value">{dossier.section}</span>
            </div>
          </div>
        </div>

        <div className="dossier-main">
          <section className="dossier-section">
            <h3 className="section-title"><FiBook /> Academic Schedule (Current Term)</h3>
            {dossier.currentSchedule?.schedules?.length > 0 ? (
              <div className="dossier-grid">
                {dossier.currentSchedule.schedules.map((sched, idx) => (
                  <div key={idx} className="schedule-card-mini">
                    <div className="schedule-time">{sched.startTime} - {sched.endTime}</div>
                    <div className="schedule-day">{sched.dayOfWeek}</div>
                    <div className="schedule-room"><FiMapPin /> {sched.roomId?.roomCode || 'TBA'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-msg">No active schedule found for the current term.</p>
            )}
          </section>

          <section className="dossier-section">
            <h3 className="section-title"><FiCalendar /> Campus Engagement</h3>
            <div className="engagement-stats">
              <div className="stat-box">
                <span className="stat-value">{dossier.currentTermEvents?.length || 0}</span>
                <span className="stat-label">Events Attended</span>
              </div>
            </div>
            {dossier.currentTermEvents?.length > 0 && (
              <ul className="event-list-mini">
                {dossier.currentTermEvents.map((ev, idx) => (
                  <li key={idx} className="event-item-mini">
                    <span className="event-date">{new Date(ev.schedule.date).toLocaleDateString()}</span>
                    <span className="event-title">{ev.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {dossier.violation && (
            <section className="dossier-section warning-section">
              <h3 className="section-title"><FiAlertTriangle /> Disciplinary Notes</h3>
              <div className="violation-alert-box">
                <p>{dossier.violation}</p>
              </div>
            </section>
          )}

          <section className="dossier-section">
            <h3 className="section-title"><FiAward /> Skills & Competencies</h3>
            <div className="skills-grid-mini">
              {dossier.skills?.map((skill, idx) => (
                <span key={idx} className="skill-tag-mini">{skill}</span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentDossierPage;
