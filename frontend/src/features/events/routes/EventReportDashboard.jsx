import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { FiBarChart2, FiUsers, FiDownload, FiAward, FiStar, FiArrowLeft, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import './EventReportDashboard.css';

export default function EventReportDashboard() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingCertificates, setGeneratingCertificates] = useState(false);

  const hasEventEnded = () => {
    if (!analytics?.endTime) return false;
    return new Date(analytics.endTime) <= new Date();
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/events/${id}/analytics`);
        
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        } else {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.message || 'Failed to fetch analytics');
        }
      } catch (err) {
        setError(err.message || 'Error fetching analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [id]);

  const handleGenerateCertificates = async () => {
    if (!confirm('This will lock the attendance record and generate certificates for all verified attendees. Are you sure you want to continue?')) {
      return;
    }

    try {
      setGeneratingCertificates(true);
      const res = await apiFetch(`/api/events/${id}/certificates`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Successfully generated ${data.certificatesGenerated} certificates`);
        // Refresh analytics
        const analyticsRes = await apiFetch(`/api/events/${id}/analytics`);
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to generate certificates');
      }
    } catch (err) {
      alert(err.message || 'Error generating certificates');
    } finally {
      setGeneratingCertificates(false);
    }
  };

  const handleDownloadBulkCertificates = async () => {
    try {
      const res = await apiFetch(`/api/events/${id}/certificates/bulk`);
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event_${id}_certificates.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to download certificates');
      }
    } catch (err) {
      alert(err.message || 'Error downloading certificates');
    }
  };

  if (loading) {
    return (
      <div className="report-dashboard-container">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-dashboard-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="report-dashboard-container">
        <div className="loading">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="report-dashboard-container">
      <div className="dashboard-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
          <span>Back</span>
        </button>
        <h1>Event Report: {analytics.title}</h1>
      </div>

      <div className="dashboard-content">
        {/* Analytics Overview */}
        <div className="analytics-overview">
          <div className="stat-card">
            <FiUsers className="stat-icon" />
            <div className="stat-content">
              <div className="stat-value">{analytics.totalRsvps}</div>
              <div className="stat-label">Total RSVPs</div>
            </div>
          </div>

          <div className="stat-card">
            <FiCheckCircle className="stat-icon success" />
            <div className="stat-content">
              <div className="stat-value">{analytics.attended}</div>
              <div className="stat-label">Attended</div>
            </div>
          </div>

          <div className="stat-card">
            <FiXCircle className="stat-icon danger" />
            <div className="stat-content">
              <div className="stat-value">{analytics.notAttended}</div>
              <div className="stat-label">No-Shows</div>
            </div>
          </div>

          <div className="stat-card">
            <FiAward className="stat-icon warning" />
            <div className="stat-content">
              <div className="stat-value">{analytics.waitlistConversions}</div>
              <div className="stat-label">Waitlist Conversions</div>
            </div>
          </div>
        </div>

        {/* Rates Grid */}
        <div className="rates-grid">
          {/* Attendance Rate */}
          <div className="rate-card">
            <h3>Attendance Rate</h3>
            <div className="rate-value">{analytics.attendanceRate.toFixed(1)}%</div>
            <div className="rate-bar">
              <div
                className="rate-fill"
                style={{ width: `${analytics.attendanceRate}%` }}
              />
            </div>
          </div>

          {/* No-Show Rate */}
          <div className="rate-card">
            <h3>No-Show Rate</h3>
            <div className="rate-value">{analytics.noShowRate.toFixed(1)}%</div>
            <div className="rate-bar">
              <div
                className="rate-fill danger"
                style={{ width: `${analytics.noShowRate}%` }}
              />
            </div>
          </div>

          {/* Waitlist Conversion Rate */}
          <div className="rate-card">
            <h3>Waitlist Conversion Rate</h3>
            <div className="rate-value">{analytics.waitlistConversionRate.toFixed(1)}%</div>
            <div className="rate-bar">
              <div
                className="rate-fill warning"
                style={{ width: `${analytics.waitlistConversionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Feedback Summary */}
        {analytics.feedbackCount > 0 && (
          <div className="feedback-summary">
            <h3>Feedback Summary</h3>
            <div className="feedback-stats">
              <div className="feedback-item">
                <FiStar className="star-icon" />
                <span className="feedback-value">{analytics.averageRating.toFixed(1)}</span>
                <span className="feedback-label">Average Rating</span>
              </div>
              <div className="feedback-item">
                <FiUsers className="users-icon" />
                <span className="feedback-value">{analytics.feedbackCount}</span>
                <span className="feedback-label">Responses</span>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Actions */}
        <div className="certificate-actions">
          <h3>Certificate Management</h3>
          {!hasEventEnded() && !analytics.certificatesGenerated ? (
            <div className="certificates-not-ready">
              <FiClock className="clock-icon" />
              <span>Certificates can be generated after the event ends</span>
            </div>
          ) : analytics.certificatesGenerated ? (
            <div className="certificates-generated">
              <FiCheckCircle className="check-icon" />
              <span>Certificates have been generated</span>
              <button
                className="download-btn"
                onClick={handleDownloadBulkCertificates}
              >
                <FiDownload />
                <span>Download All Certificates</span>
              </button>
            </div>
          ) : (
            <button
              className="generate-btn"
              onClick={handleGenerateCertificates}
              disabled={generatingCertificates}
            >
              {generatingCertificates ? (
                <>Generating...</>
              ) : (
                <>
                  <FiAward />
                  <span>Generate Certificates</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
