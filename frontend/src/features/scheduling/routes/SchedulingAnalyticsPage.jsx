import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  FiBarChart2, FiUsers, FiLayers, FiAlertCircle, 
  FiDownload, FiFilter, FiActivity, FiUserCheck, FiHome
} from 'react-icons/fi';
import { apiFetch } from '../../../lib/api';
import toast from 'react-hot-toast';
import './SchedulingAnalyticsPage.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SchedulingAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/scheduling/analytics');
        if (!res.ok) throw new Error("Failed to fetch analytics.");
        const json = await res.json();
        setData(json);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) return <div className="loading-state">Generating analytical reports...</div>;
  if (!data) return <div className="error-state">No data available.</div>;

  const { stats, alerts } = data;

  // Prepare chart data with safety checks
  const programData = stats.programDistribution 
    ? Object.entries(stats.programDistribution).map(([name, value]) => ({ name, value }))
    : [];
    
  const yearData = stats.yearLevelDistribution
    ? Object.entries(stats.yearLevelDistribution).map(([name, value]) => ({ name, value }))
    : [];
    
  const facultyData = [
    { name: 'Assigned', value: stats.facultyCoverage?.assigned || 0 },
    { name: 'Missing', value: stats.facultyCoverage?.missing || 0 }
  ];

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduling-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Analytics exported as JSON.");
  };

  return (
    <div className="analytics-page">
      <div className="directory-hero analytics-hero">
        <div className="directory-hero-icon">
          <FiBarChart2 />
        </div>
        <div>
          <p className="directory-hero-title">Scheduling Insights & Analytics</p>
          <p className="directory-hero-subtitle">
            <span>Comprehensive overview of section utilization, faculty coverage, and capacity alerts.</span>
          </p>
        </div>
        <button className="export-btn" onClick={handleExport}>
          <FiDownload /> Export Data
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon"><FiLayers /></div>
          <div className="metric-content">
            <label>Total Sections</label>
            <h3>{stats.totalSections}</h3>
          </div>
        </div>
        <div className="metric-card warning">
          <div className="metric-icon"><FiUsers /></div>
          <div className="metric-content">
            <label>Nearing Capacity</label>
            <h3>{stats.nearingCapacity}</h3>
          </div>
        </div>
        <div className="metric-card danger">
          <div className="metric-icon"><FiAlertCircle /></div>
          <div className="metric-content">
            <label>Empty Sections</label>
            <h3>{stats.emptySections}</h3>
          </div>
        </div>
        <div className="metric-card success">
          <div className="metric-icon"><FiActivity /></div>
          <div className="metric-content">
            <label>Avg Utilization</label>
            <h3>{stats.avgUtilization.toFixed(1)}%</h3>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h4 className="chart-title">Program Distribution</h4>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={programData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {programData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container">
          <h4 className="chart-title">Year Level Distribution</h4>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container">
          <h4 className="chart-title">Faculty Coverage</h4>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={facultyData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="alerts-section">
        <div className="alert-panel">
          <div className="panel-header">
            <FiAlertCircle color="#f59e0b" />
            <h4>Capacity Alerts (≥50 Students)</h4>
          </div>
          <div className="alert-list">
            {alerts.nearingCapacity.map(a => (
              <div key={a.id} className="alert-item">
                <strong>{a.identifier}</strong>
                <span className="badge warning">{a.count} / 55</span>
              </div>
            ))}
            {alerts.nearingCapacity.length === 0 && <p className="empty-msg">No sections nearing capacity.</p>}
          </div>
        </div>

        <div className="alert-panel">
          <div className="panel-header">
            <FiActivity color="#ef4444" />
            <h4>Empty Sections</h4>
          </div>
          <div className="alert-list">
            {alerts.empty.map(a => (
              <div key={a.id} className="alert-item">
                <strong>{a.identifier}</strong>
                <span className="badge danger">Requires Students</span>
              </div>
            ))}
            {alerts.empty.length === 0 && <p className="empty-msg">All sections have students.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
