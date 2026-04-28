import React from 'react';
import FilterDropdown from "../../../components/Elements/FilterDropdown";
import SkillsFilter from "../../../components/Elements/SkillsFilter";
import { FiSearch, FiRotateCcw } from 'react-icons/fi';

const StudentFilters = ({ filters, onFilterChange, loading, options }) => {
  const { faculty = [], curricula = [], events = [] } = options || {};

  const PROGRAM_OPTIONS = [
    { value: 'BSCS', label: 'BS Computer Science' },
    { value: 'BSIT', label: 'BS Information Technology' },
  ];

  const YEAR_LEVEL_OPTIONS = [
    { value: '1', label: 'Year 1' },
    { value: '2', label: 'Year 2' },
    { value: '3', label: 'Year 3' },
    { value: '4', label: 'Year 4' },
  ];

  const STATUS_OPTIONS = [
    { value: 'Enrolled', label: 'Enrolled' },
    { value: 'On Leave', label: 'On Leave' },
    { value: 'Graduating', label: 'Graduating' },
    { value: 'Graduated', label: 'Graduated' },
    { value: 'Inactive', label: 'Inactive' },
  ];

  const GENDER_OPTIONS = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
  ];

  const SCHOLARSHIP_OPTIONS = [
    { value: 'Academic Scholar', label: 'Academic Scholar' },
    { value: "Dean's Lister", label: "Dean's Lister" },
    { value: 'CHED Scholar', label: 'CHED Scholar' },
    { value: 'Athletic Grant', label: 'Athletic Grant' },
    { value: 'Industry Partner', label: 'Industry Partner' },
    { value: 'None', label: 'None' },
  ];

  const VIOLATION_OPTIONS = [
    { value: 'None', label: 'None' },
    { value: 'Warning (late)', label: 'Warning (late)' },
    { value: 'Academic probation', label: 'Academic probation' },
  ];

  const SKILL_OPTIONS = [
    { value: 'Programming', label: 'Programming' },
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Database Management', label: 'Database Management' },
    { value: 'UI/UX Design', label: 'UI/UX Design' },
    { value: 'Data Analysis', label: 'Data Analysis' },
    { value: 'Communication', label: 'Communication' },
    { value: 'Leadership', label: 'Leadership' },
    { value: 'Problem Solving', label: 'Problem Solving' },
    { value: 'JavaScript', label: 'JavaScript' },
    { value: 'React', label: 'React' },
    { value: 'Node.js', label: 'Node.js' },
  ];

  const ACADEMIC_YEAR_OPTIONS = [
    { value: '2023-2024', label: '2023-2024' },
    { value: '2024-2025', label: '2024-2025' },
    { value: '2025-2026', label: '2025-2026' },
  ];

  const TERM_OPTIONS = [
    { value: 'First Semester', label: 'First Semester' },
    { value: 'Second Semester', label: 'Second Semester' },
    { value: 'Summer', label: 'Summer' },
  ];

  const facultyOptions = faculty.map(f => ({
    value: f._id,
    label: `${f.firstName} ${f.lastName}`
  }));

  const curriculumOptions = curricula.map(c => ({
    value: c._id,
    label: `${c.courseCode} - ${c.courseTitle}`
  }));

  const eventOptions = events.map(e => ({
    value: e._id,
    label: e.title
  }));

  const handleInputChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleReset = () => {
    onFilterChange({
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
      academicYear: "",
      term: "",
    });
  };

  return (
    <div className="student-filters">
      <div className="filters-header">
        <h3>Filter Students</h3>
        <button 
          type="button" 
          className="btn btn-secondary btn-sm"
          onClick={handleReset}
          disabled={loading}
        >
          <FiRotateCcw />
          Reset Filters
        </button>
      </div>

      <div className="filters-content">
        <div className="filter-group full-width">
          <label htmlFor="search-filter">Search Students</label>
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              id="search-filter"
              type="text"
              className="form-input"
              placeholder="Search by ID, name, or email..."
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <FilterDropdown
          label="Program"
          value={filters.program}
          options={PROGRAM_OPTIONS}
          onChange={(val) => handleInputChange('program', val)}
          onClear={() => handleInputChange('program', '')}
          placeholder="All Programs"
          disabled={loading}
        />

        <FilterDropdown
          label="Year Level"
          value={filters.yearLevel}
          options={YEAR_LEVEL_OPTIONS}
          onChange={(val) => handleInputChange('yearLevel', val)}
          onClear={() => handleInputChange('yearLevel', '')}
          placeholder="All Years"
          disabled={loading}
        />

        <div className="filter-group">
          <label htmlFor="section-filter">Section</label>
          <input
            id="section-filter"
            type="text"
            className="form-input"
            value={filters.section}
            onChange={(e) => handleInputChange('section', e.target.value)}
            disabled={loading}
            placeholder="e.g. CS2A"
          />
        </div>

        <FilterDropdown
          label="Status"
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(val) => handleInputChange('status', val)}
          onClear={() => handleInputChange('status', '')}
          placeholder="All Statuses"
          disabled={loading}
        />

        <FilterDropdown
          label="Gender"
          value={filters.gender}
          options={GENDER_OPTIONS}
          onChange={(val) => handleInputChange('gender', val)}
          onClear={() => handleInputChange('gender', '')}
          placeholder="All Genders"
          disabled={loading}
        />

        <FilterDropdown
          label="Scholarship"
          value={filters.scholarship}
          options={SCHOLARSHIP_OPTIONS}
          onChange={(val) => handleInputChange('scholarship', val)}
          onClear={() => handleInputChange('scholarship', '')}
          placeholder="All Scholarships"
          disabled={loading}
        />

        <FilterDropdown
          label="Violation"
          value={filters.violation}
          options={VIOLATION_OPTIONS}
          onChange={(val) => handleInputChange('violation', val)}
          onClear={() => handleInputChange('violation', '')}
          placeholder="All Violations"
          disabled={loading}
        />

        <FilterDropdown
          label="Faculty/Instructor"
          value={filters.facultyId}
          options={facultyOptions}
          onChange={(val) => handleInputChange('facultyId', val)}
          onClear={() => handleInputChange('facultyId', '')}
          placeholder="All Faculty"
          disabled={loading}
        />

        <FilterDropdown
          label="Subject/Curriculum"
          value={filters.curriculumId}
          options={curriculumOptions}
          onChange={(val) => handleInputChange('curriculumId', val)}
          onClear={() => handleInputChange('curriculumId', '')}
          placeholder="All Subjects"
          disabled={loading}
        />

        <FilterDropdown
          label="Attended Event"
          value={filters.eventId}
          options={eventOptions}
          onChange={(val) => handleInputChange('eventId', val)}
          onClear={() => handleInputChange('eventId', '')}
          placeholder="All Events"
          disabled={loading}
        />

        <FilterDropdown
          label="Academic Year"
          value={filters.academicYear}
          options={ACADEMIC_YEAR_OPTIONS}
          onChange={(val) => handleInputChange('academicYear', val)}
          onClear={() => handleInputChange('academicYear', '')}
          placeholder="Select Year"
          disabled={loading}
        />

        <FilterDropdown
          label="Term"
          value={filters.term}
          options={TERM_OPTIONS}
          onChange={(val) => handleInputChange('term', val)}
          onClear={() => handleInputChange('term', '')}
          placeholder="Select Term"
          disabled={loading}
        />

        <div className="filter-group full-width">
          <SkillsFilter
            label="Skills & Competencies"
            value={filters.skill}
            options={SKILL_OPTIONS}
            onChange={(val) => handleInputChange('skill', val)}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentFilters;
