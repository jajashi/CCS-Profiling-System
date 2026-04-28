import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiUsers, FiInfo, FiFileText } from "react-icons/fi";
import StudentFilters from "./components/StudentFilters";
import StudentList from "./components/StudentList";
import { getStudentsForReports } from "../../services/reportsService";
import { apiFetch } from "../../lib/api";

import "./ReportsPage.css";

const ReportsPage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  const [filters, setFilters] = useState({
    search: "",
    program: "",
    yearLevel: "",
    section: "",
    status: "",
    skill: [],
    scholarship: "",
    gender: "",
    violation: "",
    facultyId: "",
    curriculumId: "",
    eventId: "",
    academicYear: "", // Default to empty to avoid aggressive filtering
    term: "",
  });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Debounce logic for filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchStudents = useCallback(async (page = 1, activeFilters = debouncedFilters) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value && (Array.isArray(value) ? value.length > 0 : String(value).trim() !== "")) {
          if (Array.isArray(value)) {
            queryParams.append(key, value.join(","));
          } else {
            queryParams.append(key, value);
          }
        }
      });

      const response = await getStudentsForReports(queryParams.toString());
      setStudents(response.students || []);
      setPagination(response.pagination || { page: 1, limit: 50, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
    } catch (error) {
      toast.error("Failed to fetch students");
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  const [filterOptions, setFilterOptions] = useState({
    faculty: [],
    curricula: [],
    events: [],
  });

  const fetchFilterOptions = async () => {
    try {
      const [facultyRes, curriculaRes, eventsRes] = await Promise.all([
        apiFetch("/api/faculty"),
        apiFetch("/api/curricula"), // Fixed plural
        apiFetch("/api/events"),
      ]);

      const [faculty, curricula, events] = await Promise.all([
        facultyRes.json(),
        curriculaRes.json(),
        eventsRes.json(),
      ]);

      setFilterOptions({
        faculty: Array.isArray(faculty) ? faculty : (faculty.faculty || []),
        curricula: Array.isArray(curricula) ? curricula : [],
        events: Array.isArray(events) ? (events.events || events) : [],
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchStudents(1, debouncedFilters);
  }, [debouncedFilters, fetchStudents]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleViewProfile = (studentId) => {
    navigate(`/dashboard/reports/student/${studentId}`);
  };

  const handlePageChange = (newPage) => {
    fetchStudents(newPage);
  };

  return (
    <div className="reports-page student-directory">
      <div className="directory-hero student-hero">
        <div className="directory-hero-icon">
          <FiFileText />
        </div>
        <div>
          <p className="directory-hero-title">360-Degree Student Reports</p>
          <p className="directory-hero-subtitle">
            <FiInfo />
            <span>Generate comprehensive student profiles with academic, extracurricular, and administrative data.</span>
          </p>
        </div>
      </div>

      <div className="reports-layout">
        <div className="reports-filters-container">
          <StudentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            loading={loading}
            options={filterOptions}
          />
        </div>

        <div className="reports-main">
          <StudentList
            students={students}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onViewProfile={handleViewProfile}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
