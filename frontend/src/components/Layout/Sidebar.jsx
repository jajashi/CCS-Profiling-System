import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiBriefcase,
  FiBookOpen,
  FiCalendar,
  FiStar,
  FiLogOut,
  FiBarChart2,
  FiLayers,
  FiChevronDown,
  FiChevronUp,
  FiUserCheck,
} from 'react-icons/fi';
import { useAuth } from '../../providers/AuthContext';
import logoSrc from '../../assets/images/ccs-logo.jpg';

const FACULTY_PREFIX = '/dashboard/faculty';
const INSTRUCTION_PREFIX = '/dashboard/instruction';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin, isStudent, user } = useAuth();
  const [facultyNavOpen, setFacultyNavOpen] = useState(() =>
    location.pathname.startsWith(FACULTY_PREFIX),
  );
  const [instructionNavOpen, setInstructionNavOpen] = useState(() =>
    location.pathname.startsWith(INSTRUCTION_PREFIX),
  );

  useEffect(() => {
    if (location.pathname.startsWith(FACULTY_PREFIX)) {
      setFacultyNavOpen(true);
    }
    if (location.pathname.startsWith(INSTRUCTION_PREFIX)) {
      setInstructionNavOpen(true);
    }
  }, [location.pathname]);

  const isFacultySectionActive = location.pathname.startsWith(FACULTY_PREFIX);
  const isInstructionSectionActive = location.pathname.startsWith(INSTRUCTION_PREFIX);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img
            src={logoSrc}
            alt="CCS"
            className="logo-img"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
          />
          <span style={{ display: 'none' }} className="text-logo">CCS</span>
        </div>
        <h2 className="brand-name">
          {isAdmin ? "CCS Student Profiling System" : "CCS Student Profile"}
        </h2>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <span className="nav-icon"><FiHome /></span>
              <span className="nav-text">Dashboard</span>
            </NavLink>
          </li>

          {isStudent ? (
            <li className="nav-item">
              <NavLink to={`/dashboard/student-info/${user?.studentId || ''}`} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <span className="nav-icon"><FiUsers /></span>
                <span className="nav-text">My Profile</span>
              </NavLink>
            </li>
          ) : (
            <>
              <li className="nav-item">
                <NavLink to="/dashboard/student-info" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  <span className="nav-icon"><FiUsers /></span>
                  <span className="nav-text">Student Information</span>
                </NavLink>
              </li>

              <li className={`nav-item nav-group${facultyNavOpen ? ' nav-group--open' : ''}`}>
                <button
                  type="button"
                  className={`nav-link nav-group-toggle${isFacultySectionActive ? ' nav-group-toggle--within' : ''}`}
                  aria-expanded={facultyNavOpen}
                  aria-controls="sidebar-faculty-subnav"
                  id="sidebar-faculty-trigger"
                  onClick={() => setFacultyNavOpen((open) => !open)}
                >
                  <span className="nav-icon"><FiBriefcase /></span>
                  <span className="nav-text">Faculty Directory</span>
                  <span className="nav-group-chevron" aria-hidden>
                    {facultyNavOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </button>
                {facultyNavOpen ? (
                  <ul className="nav-sublist" id="sidebar-faculty-subnav" role="list">
                    {isAdmin ? (
                      <li className="nav-subitem">
                        <NavLink
                          to="/dashboard/faculty"
                          end
                          className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                        >
                          <span className="nav-icon nav-sublink-icon"><FiBarChart2 /></span>
                          <span className="nav-text">Faculty overview</span>
                        </NavLink>
                      </li>
                    ) : null}
                    <li className="nav-subitem">
                      <NavLink
                        to="/dashboard/faculty/directory"
                        className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                      >
                        <span className="nav-icon nav-sublink-icon"><FiUserCheck /></span>
                        <span className="nav-text">Faculty Information</span>
                      </NavLink>
                    </li>
                    {isAdmin ? (
                      <li className="nav-subitem">
                        <NavLink
                          to="/dashboard/faculty/specializations"
                          end
                          className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                        >
                          <span className="nav-icon nav-sublink-icon"><FiLayers /></span>
                          <span className="nav-text">Specializations</span>
                        </NavLink>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </li>

              <li className={`nav-item nav-group${instructionNavOpen ? ' nav-group--open' : ''}`}>
                <button
                  type="button"
                  className={`nav-link nav-group-toggle${isInstructionSectionActive ? ' nav-group-toggle--within' : ''}`}
                  aria-expanded={instructionNavOpen}
                  aria-controls="sidebar-instruction-subnav"
                  id="sidebar-instruction-trigger"
                  onClick={() => setInstructionNavOpen((open) => !open)}
                >
                  <span className="nav-icon"><FiBookOpen /></span>
                  <span className="nav-text">Instruction</span>
                  <span className="nav-group-chevron" aria-hidden>
                    {instructionNavOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </button>
                {instructionNavOpen ? (
                  <ul className="nav-sublist" id="sidebar-instruction-subnav" role="list">
                    <li className="nav-subitem">
                      <NavLink
                        to="/dashboard/instruction/curricula"
                        end
                        className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                      >
                        <span className="nav-icon nav-sublink-icon"><FiLayers /></span>
                        <span className="nav-text">Curricula</span>
                      </NavLink>
                    </li>
                    <li className="nav-subitem">
                      <NavLink
                        to="/dashboard/instruction/syllabi"
                        end
                        className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                      >
                        <span className="nav-icon nav-sublink-icon"><FiBookOpen /></span>
                        <span className="nav-text">Syllabi</span>
                      </NavLink>
                    </li>
                  </ul>
                ) : null}
              </li>

              <li className="nav-item">
                <NavLink to="/dashboard/scheduling" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  <span className="nav-icon"><FiCalendar /></span>
                  <span className="nav-text">Scheduling</span>
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink to="/dashboard/events" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  <span className="nav-icon"><FiStar /></span>
                  <span className="nav-text">Events</span>
                </NavLink>
              </li>
            </>
          )}
          
          {isAdmin ? (
            <li className="nav-item">
              <NavLink to="/dashboard/reports" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <span className="nav-icon"><FiBarChart2 /></span>
                <span className="nav-text">Reports</span>
              </NavLink>
            </li>
          ) : null}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-link logout-btn" onClick={handleLogout}>
          <span className="nav-icon"><FiLogOut /></span>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
