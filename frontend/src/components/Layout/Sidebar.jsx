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
  FiAward,
  FiUser,
  FiClock,
  FiGrid,
} from 'react-icons/fi';
import { useAuth } from '../../providers/AuthContext';
import logoSrc from '../../assets/images/ccs-logo.jpg';

const FACULTY_PREFIX = '/dashboard/faculty';
const FACULTY_CLASSES_PATH = '/dashboard/faculty/classes';
const INSTRUCTION_PREFIX = '/dashboard/instruction';
const SCHEDULING_PREFIX = '/dashboard/scheduling';
const MY_SCHEDULE_PATH = '/dashboard/scheduling/my-schedule';
const EVENTS_PREFIX = '/dashboard/events';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin, isFaculty, isStudent, user } = useAuth();
  const facultyDirectoryLink =
    isFaculty && user?.employeeId
      ? `/dashboard/faculty/directory/${encodeURIComponent(user.employeeId)}`
      : '/dashboard/faculty/directory';
  const [facultyNavOpen, setFacultyNavOpen] = useState(() =>
    location.pathname.startsWith(FACULTY_PREFIX),
  );
  const [instructionNavOpen, setInstructionNavOpen] = useState(() =>
    location.pathname.startsWith(INSTRUCTION_PREFIX),
  );
  const [schedulingNavOpen, setSchedulingNavOpen] = useState(() =>
    location.pathname.startsWith(SCHEDULING_PREFIX),
  );
  const [eventsNavOpen, setEventsNavOpen] = useState(() =>
    location.pathname.startsWith(EVENTS_PREFIX),
  );

  useEffect(() => {
    const p = location.pathname;
    if (p.startsWith(FACULTY_PREFIX)) {
      setFacultyNavOpen(true);
    } else {
      setFacultyNavOpen(false);
    }
    if (p.startsWith(INSTRUCTION_PREFIX)) {
      setInstructionNavOpen(true);
    } else {
      setInstructionNavOpen(false);
    }
    if (p.startsWith(SCHEDULING_PREFIX)) {
      setSchedulingNavOpen(true);
    } else {
      setSchedulingNavOpen(false);
    }
    if (p.startsWith(EVENTS_PREFIX)) {
      setEventsNavOpen(true);
    } else {
      setEventsNavOpen(false);
    }
  }, [location.pathname]);

  const isFacultySectionActive = location.pathname.startsWith(FACULTY_PREFIX);
  const isInstructionSectionActive = location.pathname.startsWith(INSTRUCTION_PREFIX);
  const isSchedulingSectionActive = location.pathname.startsWith(SCHEDULING_PREFIX);

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
          {isAdmin ? 'CCS Student Profiling System' : isFaculty ? 'CCS Faculty Portal' : 'CCS Student Profile'}
        </h2>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {!isFaculty ? (
            <li className="nav-item">
              <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <span className="nav-icon"><FiHome /></span>
                <span className="nav-text">Dashboard</span>
              </NavLink>
            </li>
          ) : null}

          {isStudent ? (
            <li className="nav-item">
              <NavLink to={`/dashboard/student-info/${user?.studentId || ''}`} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <span className="nav-icon"><FiUsers /></span>
                <span className="nav-text">My Profile</span>
              </NavLink>
            </li>
          ) : isFaculty && !isAdmin ? (
            <>
              <li className="nav-item">
                <NavLink
                  to={FACULTY_CLASSES_PATH}
                  end
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <span className="nav-icon"><FiGrid /></span>
                  <span className="nav-text">My Classes</span>
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to={MY_SCHEDULE_PATH}
                  end
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <span className="nav-icon"><FiCalendar /></span>
                  <span className="nav-text">My Schedule</span>
                </NavLink>
              </li>

              <li className={`nav-item nav-group${instructionNavOpen ? ' nav-group--open' : ''}`}>
                <button
                  type="button"
                  className={`nav-link nav-group-toggle${isInstructionSectionActive ? ' nav-group-toggle--within' : ''}`}
                  aria-expanded={instructionNavOpen}
                  aria-controls="sidebar-faculty-instruction-subnav"
                  id="sidebar-faculty-instruction-trigger"
                  onClick={() => setInstructionNavOpen((open) => !open)}
                >
                  <span className="nav-icon"><FiBookOpen /></span>
                  <span className="nav-text">Instruction</span>
                  <span className="nav-group-chevron" aria-hidden>
                    {instructionNavOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </button>
                {instructionNavOpen ? (
                  <ul className="nav-sublist" id="sidebar-faculty-instruction-subnav" role="list">
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
            </>
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
                    <li className="nav-subitem">
                      <NavLink
                        to="/dashboard/faculty/directory"
                        className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                      >
                        <span className="nav-icon nav-sublink-icon"><FiUserCheck /></span>
                        <span className="nav-text">Faculty Information</span>
                      </NavLink>
                    </li>
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

              <li className={`nav-item nav-group${schedulingNavOpen ? ' nav-group--open' : ''}`}>
                <button
                  type="button"
                  className={`nav-link nav-group-toggle${isSchedulingSectionActive ? ' nav-group-toggle--within' : ''}`}
                  aria-expanded={schedulingNavOpen}
                  aria-controls="sidebar-scheduling-subnav"
                  id="sidebar-scheduling-trigger"
                  onClick={() => setSchedulingNavOpen((open) => !open)}
                >
                  <span className="nav-icon"><FiCalendar /></span>
                  <span className="nav-text">Scheduling</span>
                  <span className="nav-group-chevron" aria-hidden>
                    {schedulingNavOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </button>
                {schedulingNavOpen ? (
                  <ul className="nav-sublist" id="sidebar-scheduling-subnav" role="list">
                    <li className="nav-subitem">
                      <NavLink
                        to="/dashboard/scheduling"
                        end
                        className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                      >
                        <span className="nav-icon nav-sublink-icon"><FiClock /></span>
                        <span className="nav-text">Time blocks</span>
                      </NavLink>
                    </li>
                    <li className="nav-subitem">
                      <NavLink
                        to="/dashboard/scheduling/rooms"
                        end
                        className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                      >
                        <span className="nav-icon nav-sublink-icon"><FiGrid /></span>
                        <span className="nav-text">Room registry</span>
                      </NavLink>
                    </li>
                    <li className="nav-subitem">
                      <NavLink
                        to="/dashboard/scheduling/sections"
                        end
                        className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                      >
                        <span className="nav-icon nav-sublink-icon"><FiLayers /></span>
                        <span className="nav-text">Manage Sections</span>
                      </NavLink>
                    </li>
                    <li className="nav-subitem">
                      <NavLink
                        to="/dashboard/scheduling/overview"
                        end
                        className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                      >
                        <span className="nav-icon nav-sublink-icon"><FiLayers /></span>
                        <span className="nav-text">Scheduling Matrix</span>
                      </NavLink>
                    </li>
                  </ul>
                ) : null}
              </li>
            </>
          )}

          <li className={`nav-item nav-group${eventsNavOpen ? ' nav-group--open' : ''}`}>
            <button
              type="button"
              className={`nav-link nav-group-toggle${location.pathname.startsWith(EVENTS_PREFIX) ? ' nav-group-toggle--within' : ''}`}
              aria-expanded={eventsNavOpen}
              aria-controls="sidebar-events-subnav"
              id="sidebar-events-trigger"
              onClick={() => setEventsNavOpen((open) => !open)}
            >
              <span className="nav-icon"><FiStar /></span>
              <span className="nav-text">Events</span>
              <span className="nav-group-chevron" aria-hidden>
                {eventsNavOpen ? <FiChevronUp /> : <FiChevronDown />}
              </span>
            </button>
            {eventsNavOpen ? (
              <ul className="nav-sublist" id="sidebar-events-subnav" role="list">
                <li className="nav-subitem">
                  <NavLink
                    to="/dashboard/events"
                    end
                    className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                  >
                    <span className="nav-icon nav-sublink-icon"><FiGrid /></span>
                    <span className="nav-text">List Events</span>
                  </NavLink>
                </li>
                {isStudent ? (
                  <li className="nav-subitem">
                    <NavLink
                      to="/dashboard/my-events"
                      className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                    >
                      <span className="nav-icon nav-sublink-icon"><FiAward /></span>
                      <span className="nav-text">My Events</span>
                    </NavLink>
                  </li>
                ) : null}
                {!isStudent ? (
                  <li className="nav-subitem">
                    <NavLink
                      to="/dashboard/events/create"
                      className={({ isActive }) => (isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink')}
                    >
                      <span className="nav-icon nav-sublink-icon"><FiCalendar /></span>
                      <span className="nav-text">Create Event</span>
                    </NavLink>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </li>
          
                  </ul>
      </nav>

      <div className="sidebar-footer">
        {isFaculty && !isAdmin ? (
          <NavLink
            to={facultyDirectoryLink}
            className={({ isActive }) =>
              isActive ? 'nav-link sidebar-footer-link active' : 'nav-link sidebar-footer-link'
            }
          >
            <span className="nav-icon"><FiUser /></span>
            <span className="nav-text">Faculty Profile</span>
          </NavLink>
        ) : null}
        <button type="button" className="nav-link logout-btn" onClick={handleLogout}>
          <span className="nav-icon"><FiLogOut /></span>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
