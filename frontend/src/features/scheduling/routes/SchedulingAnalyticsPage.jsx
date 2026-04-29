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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    toast.loading("Generating PDF report...", { id: "pdf-export" });
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text("Scheduling Analytics Report", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 30);
      
      let yPos = 40;
      
      // Summary Metrics
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Summary Metrics", 14, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Total Sections', stats.totalSections],
          ['Nearing Capacity', stats.nearingCapacity],
          ['Empty Sections', stats.emptySections],
          ['Average Utilization', `${stats.avgUtilization.toFixed(1)}%`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
      
      // Program Distribution
      doc.setFontSize(14);
      doc.text("Program Distribution", 14, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Program', 'Count']],
        body: programData.map(d => [d.name, d.value]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
      
      // Year Level Distribution
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text("Year Level Distribution", 14, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Year Level', 'Count']],
        body: yearData.map(d => [d.name, d.value]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
      
      // Faculty Coverage
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text("Faculty Coverage", 14, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Status', 'Count']],
        body: facultyData.map(d => [d.name, d.value]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
      
      // Capacity Alerts
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text("Capacity Alerts (≥50 Students)", 14, yPos);
      yPos += 8;
      
      const capacityAlertsBody = alerts.nearingCapacity.length > 0 
        ? alerts.nearingCapacity.map(a => [a.identifier, `${a.count} / 55`])
        : [['No sections nearing capacity', '']];
        
      autoTable(doc, {
        startY: yPos,
        head: [['Section Identifier', 'Current Enrolled']],
        body: capacityAlertsBody,
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
      
      // Empty Sections
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text("Empty Sections", 14, yPos);
      yPos += 8;
      
      const emptyAlertsBody = alerts.empty.length > 0
        ? alerts.empty.map(a => [a.identifier, 'Requires Students'])
        : [['All sections have students', '']];
        
      autoTable(doc, {
        startY: yPos,
        head: [['Section Identifier', 'Status']],
        body: emptyAlertsBody,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] }
      });
      
      doc.save(`scheduling-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF report generated successfully!", { id: "pdf-export" });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate PDF.";
      toast.error(errorMessage, { id: "pdf-export" });
    }
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
          <FiDownload /> Export to PDF
        </button>
      </div>

      <div id="analytics-report-content" className="analytics-report-content">
        <div className="pdf-only-header">
          <h2>Scheduling Analytics Report</h2>
          <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={programData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={70}
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container">
          <h4 className="chart-title">Faculty Coverage</h4>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={facultyData}
                  cx="50%"
                  cy="45%"
                  outerRadius={70}
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
    </div>
  );
}
