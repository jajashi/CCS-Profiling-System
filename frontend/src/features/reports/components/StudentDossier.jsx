import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getStudentDossier,
  exportStudentProfilePDF,
} from "../../../services/reportsService";
import { useAuth } from "../../../providers/AuthContext";
import ProfileInfoCard from "./ProfileInfoCard";
import GuardianInfoCard from "./GuardianInfoCard";
import ScheduleCard from "./ScheduleCard";
import EventsCard from "./EventsCard";
import AdministrativeCard from "./AdministrativeCard";
import "./StudentDossier.css";

const StudentDossier = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchStudentDossier = async () => {
    try {
      const data = await getStudentDossier(id);
      setStudent(data);
    } catch (error) {
      toast.error("Failed to load student profile");
      console.error("Error fetching student dossier:", error);
      if (error.response?.status === 404) {
        navigate("/dashboard/reports");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDossier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportStudentProfilePDF(id);
      toast.success("PDF exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error("Error exporting PDF:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleBack = () => {
    navigate("/dashboard/reports");
  };

  if (loading) {
    return (
      <div className="student-dossier loading">
        <div className="loading-spinner">Loading student profile...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="student-dossier error">
        <div className="error-state">
          <h3>Student not found</h3>
          <button onClick={handleBack} className="btn btn-primary">
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="student-dossier">
      <div className="dossier-header">
        <div className="header-left">
          <button onClick={handleBack} className="btn btn-secondary">
            ← Back to Reports
          </button>
          <h1>360-Degree Student Profile</h1>
        </div>

        <div className="header-actions">
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="btn btn-primary">
            {exporting ? "Exporting..." : "Export Profile (PDF)"}
          </button>
        </div>
      </div>

      <div className="dossier-content">
        <div className="dossier-grid">
          {/* Profile Information Card */}
          <ProfileInfoCard student={student} />

          {/* Guardian/Emergency Information Card */}
          <GuardianInfoCard student={student} />

          {/* Current Term Schedule Card */}
          <ScheduleCard
            schedule={student.currentSchedule}
            program={student.program}
          />

          {/* Current Term Events Card */}
          <EventsCard events={student.currentTermEvents} />

          {/* Administrative Records Card - Only for Admin */}
          {isAdmin && (
            <AdministrativeCard
              skills={student.skills}
              violation={student.violation}
            />
          )}

          {/* Skills Card - For Faculty (without violations) */}
          {!isAdmin && student.skills && student.skills.length > 0 && (
            <div className="card skills-card">
              <h3>Skills & Competencies</h3>
              <div className="skills-list">
                {student.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDossier;
