import axios from "axios"

import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  useLocation,
  useNavigate,
} from "react-router-dom"

import UserProfile from "./UserProfile"

type Task = {
  id: number
  title: string
  completed: boolean
}

type Habit = {
  id: number
  name: string
  completed: boolean
}

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false)

  const [
    incompleteTasks,
    setIncompleteTasks,
  ] = useState(0)

  const [
    incompleteHabits,
    setIncompleteHabits,
  ] = useState(0)

  const notificationRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchNotifications =
      async () => {
        try {
          const [
            tasksResponse,
            habitsResponse,
          ] = await Promise.all([
            axios.get(
              "http://localhost:5000/api/tasks"
            ),

            axios.get(
              "http://localhost:5000/api/habits"
            ),
          ])

          const tasks: Task[] =
            tasksResponse.data

          const habits: Habit[] =
            habitsResponse.data

          setIncompleteTasks(
            tasks.filter(
              (task) =>
                !task.completed
            ).length
          )

          setIncompleteHabits(
            habits.filter(
              (habit) =>
                !habit.completed
            ).length
          )
        } catch (error) {
          console.error(
            "Error fetching notifications:",
            error
          )
        }
      }

    fetchNotifications()
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node
        )
      ) {
        setShowNotifications(false)
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      )
    }
  }, [])

  const notificationCount =
    incompleteTasks +
    incompleteHabits

  const handleNotificationClick = (
    page: string
  ) => {
    setShowNotifications(false)
    navigate(page)
  }

  const pageNames: Record<
    string,
    string
  > = {
    "/": "Overview",
    "/tasks": "Tasks",
    "/habits": "Habits",
    "/study": "Study",
    "/expenses": "Expenses",
    "/journal": "Journal",
    "/goals": "Goals",
    "/settings": "Settings",
  }

  const pageTitle =
    pageNames[
      location.pathname
    ] || "TinyLife"

  return (
    <nav className="navbar">

      <div className="navbar-left">
        <span className="page-title">
          {pageTitle}
        </span>
      </div>

      <div className="navbar-right">

        <div
          className="notification-wrapper"
          ref={notificationRef}
        >

          <button
            type="button"
            className="notification-button"
            aria-label="Notifications"
            onClick={() =>
              setShowNotifications(
                (current) =>
                  !current
              )
            }
          >
            Notifications

            {notificationCount >
              0 && (
              <span className="notification-badge">
                {notificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-panel">

              <div className="notification-header">
                <h3>
                  Notifications
                </h3>
              </div>

              {incompleteTasks >
                0 && (
                <button
                  type="button"
                  className="notification-item"
                  onClick={() =>
                    handleNotificationClick(
                      "/tasks"
                    )
                  }
                >
                  <p>
                    You have{" "}
                    {incompleteTasks}{" "}
                    incomplete{" "}
                    {incompleteTasks ===
                    1
                      ? "task"
                      : "tasks"}
                    .
                  </p>

                  <span>
                    Complete them to
                    stay on track.
                  </span>
                </button>
              )}

              {incompleteHabits >
                0 && (
                <button
                  type="button"
                  className="notification-item"
                  onClick={() =>
                    handleNotificationClick(
                      "/habits"
                    )
                  }
                >
                  <p>
                    You have{" "}
                    {incompleteHabits}{" "}
                    {incompleteHabits ===
                    1
                      ? "habit"
                      : "habits"}{" "}
                    left to complete
                    today.
                  </p>

                  <span>
                    Keep your daily
                    streak going.
                  </span>
                </button>
              )}

              {notificationCount ===
                0 && (
                <div className="notification-empty">

                  <p>
                    No new
                    notifications.
                  </p>

                  <span>
                    You're all caught
                    up.
                  </span>

                </div>
              )}

            </div>
          )}

        </div>

        <UserProfile />

      </div>

    </nav>
  )
}

export default Navbar