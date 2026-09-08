import { NavLink } from "react-router-dom"

function Sidebar() {
  const getMenuClass = ({
    isActive,
  }: {
    isActive: boolean
  }) =>
    isActive
      ? "menu-item active"
      : "menu-item"

  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        TinyLife
      </div>

      <nav className="sidebar-menu">

        <NavLink
          to="/"
          className={getMenuClass}
        >
          Overview
        </NavLink>

        <NavLink
          to="/tasks"
          className={getMenuClass}
        >
          Tasks
        </NavLink>

        <NavLink
          to="/habits"
          className={getMenuClass}
        >
          Habits
        </NavLink>

        <NavLink
          to="/study"
          className={getMenuClass}
        >
          Study
        </NavLink>

        <NavLink
          to="/expenses"
          className={getMenuClass}
        >
          Expenses
        </NavLink>

        <NavLink
          to="/journal"
          className={getMenuClass}
        >
          Journal
        </NavLink>

        <NavLink
          to="/goals"
          className={getMenuClass}
        >
          Goals
        </NavLink>

      </nav>

    </aside>
  )
}

export default Sidebar