import { useEffect, useState } from "react"
import axios from "axios"

type Task = {
  id: number
  title: string
  completed: boolean
}

type Habit = {
  id: number
  name: string
  completed: boolean
  streak: number
  last_completed_date: string | null
}

type StudySession = {
  id: number
  minutes: number
  date: string
}

type Expense = {
  id: number
  title: string
  amount: number
  date: string
}

type Goal = {
  id: number
  title: string
  progress: number
}

function Overview() {
  const [tasks, setTasks] =
    useState<Task[]>([])

  const [habits, setHabits] =
    useState<Habit[]>([])

  const [studySessions, setStudySessions] =
    useState<StudySession[]>([])

  const [expenses, setExpenses] =
    useState<Expense[]>([])

  const [goals, setGoals] =
    useState<Goal[]>([])

  const [userName, setUserName] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "tinylife-user"
      )

    if (savedUser) {
      try {
        const user =
          JSON.parse(savedUser)

        setUserName(user.name)
      } catch (error) {
        console.error(
          "Error reading logged-in user:",
          error
        )
      }
    }

    const fetchOverviewData =
      async () => {
        try {
          const [
            tasksResponse,
            habitsResponse,
            studyResponse,
            expensesResponse,
            goalsResponse,
          ] = await Promise.all([
            axios.get(
              "http://localhost:5000/api/tasks"
            ),

            axios.get(
              "http://localhost:5000/api/habits"
            ),

            axios.get(
              "http://localhost:5000/api/study"
            ),

            axios.get(
              "http://localhost:5000/api/expenses"
            ),

            axios.get(
              "http://localhost:5000/api/goals"
            ),
          ])

          setTasks(
            tasksResponse.data
          )

          setHabits(
            habitsResponse.data
          )

          setStudySessions(
            studyResponse.data
          )

          setExpenses(
            expensesResponse.data
          )

          setGoals(
            goalsResponse.data
          )

          setError("")
        } catch (error) {
          console.error(
            "Error fetching overview data:",
            error
          )

          setError(
            "Couldn't load your dashboard. Please try again."
          )
        } finally {
          setLoading(false)
        }
      }

    fetchOverviewData()
  }, [])

  // --------------------
  // TASKS
  // --------------------

  const completedTasks =
    tasks.filter(
      (task) => task.completed
    ).length

  const taskProgress =
    tasks.length > 0
      ? Math.round(
          (completedTasks /
            tasks.length) *
            100
        )
      : 0

  // --------------------
  // HABITS
  // --------------------

  const completedHabits =
    habits.filter(
      (habit) => habit.completed
    ).length

  const habitProgress =
    habits.length > 0
      ? Math.round(
          (completedHabits /
            habits.length) *
            100
        )
      : 0

  // --------------------
  // STUDY
  // --------------------

  const totalStudyMinutes =
    studySessions.reduce(
      (total, session) =>
        total +
        Number(session.minutes),
      0
    )

  const studyHours =
    Math.floor(
      totalStudyMinutes / 60
    )

  const studyMinutes =
    totalStudyMinutes % 60

  // --------------------
  // EXPENSES
  // --------------------

  const totalExpenses =
    expenses.reduce(
      (total, expense) =>
        total +
        Number(expense.amount),
      0
    )

  // --------------------
  // GOALS
  // --------------------

  const averageGoalProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce(
            (total, goal) =>
              total +
              Number(
                goal.progress
              ),
            0
          ) / goals.length
        )
      : 0

  // --------------------
  // OVERALL PROGRESS
  // --------------------

  const overallProgress =
    goals.length > 0
      ? Math.round(
          (taskProgress +
            habitProgress +
            averageGoalProgress) /
            3
        )
      : Math.round(
          (taskProgress +
            habitProgress) /
            2
        )

  return (
    <div className="overview-page">

      <h1>
        Good afternoon, {userName}
      </h1>

      <p>
        Here's a little look at
        your life today.
      </p>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      {/* --------------------
          STATS
      -------------------- */}

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-card-top">

            <div className="stat-icon">
              T
            </div>

            <div className="stat-title">
              Tasks
            </div>

          </div>

          <div className="stat-value">

            {loading
              ? "—"
              : `${completedTasks}/${tasks.length}`}

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-card-top">

            <div className="stat-icon">
              H
            </div>

            <div className="stat-title">
              Habits
            </div>

          </div>

          <div className="stat-value">

            {loading
              ? "—"
              : `${completedHabits}/${habits.length}`}

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-card-top">

            <div className="stat-icon">
              S
            </div>

            <div className="stat-title">
              Study Time
            </div>

          </div>

          <div className="stat-value">

            {loading
              ? "—"
              : `${studyHours}h ${studyMinutes}m`}

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-card-top">

            <div className="stat-icon">
              ₹
            </div>

            <div className="stat-title">
              Total Expenses
            </div>

          </div>

          <div className="stat-value">

            {loading
              ? "—"
              : `₹${totalExpenses.toFixed(2)}`}

          </div>

        </div>

      </div>

      {/* --------------------
          TODAY'S TASKS
      -------------------- */}

      <div className="overview-tasks">

        <div className="section-header">
          <h2>
            Today's Tasks
          </h2>
        </div>

        {loading ? (

          <div className="empty-state">

            <h3>
              Loading tasks...
            </h3>

            <p>
              Just a moment.
            </p>

          </div>

        ) : tasks.length === 0 ? (

          <p>
            No tasks yet.
          </p>

        ) : (

          <div className="overview-task-list">

            {tasks.map(
              (task) => (

                <div
                  className="overview-task-item"
                  key={task.id}
                >

                  <span
                    className={
                      task.completed
                        ? "task-completed"
                        : ""
                    }
                  >
                    {task.title}
                  </span>

                  <span>
                    {task.completed
                      ? "Completed"
                      : "Pending"}
                  </span>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* --------------------
          TODAY'S HABITS
      -------------------- */}

      <div className="overview-tasks">

        <div className="section-header">
          <h2>
            Today's Habits
          </h2>
        </div>

        {loading ? (

          <div className="empty-state">

            <h3>
              Loading habits...
            </h3>

            <p>
              Just a moment.
            </p>

          </div>

        ) : habits.length === 0 ? (

          <p>
            No habits yet.
          </p>

        ) : (

          <div className="overview-task-list">

            {habits.map(
              (habit) => (

                <div
                  className="overview-task-item"
                  key={habit.id}
                >

                  <span
                    className={
                      habit.completed
                        ? "task-completed"
                        : ""
                    }
                  >
                    {habit.name}
                  </span>

                  <span>
                    {habit.completed
                      ? "Completed"
                      : "Pending"}
                  </span>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* --------------------
          GOAL PROGRESS
      -------------------- */}

      <div className="overview-goals">

        <div className="section-header">
          <h2>
            Goal Progress
          </h2>
        </div>

        {loading ? (

          <div className="empty-state">

            <h3>
              Loading goals...
            </h3>

            <p>
              Just a moment.
            </p>

          </div>

        ) : goals.length === 0 ? (

          <p>
            No goals yet.
          </p>

        ) : (

          goals.map(
            (goal) => (

              <div
                className="goal-item"
                key={goal.id}
              >

                <div className="progress-header">

                  <span>
                    {goal.title}
                  </span>

                  <span>
                    {goal.progress}%
                  </span>

                </div>

                <div className="progress-bar">

                  <div
                    className="progress-fill"
                    style={{
                      width:
                        `${goal.progress}%`,
                    }}
                  />

                </div>

              </div>

            )
          )

        )}

      </div>

      {/* --------------------
          OVERALL PROGRESS
      -------------------- */}

      <div className="today-progress">

        <div className="progress-header">

          <h2>
            Overall Progress
          </h2>

          <span>
            {loading
              ? "—"
              : `${overallProgress}%`}
          </span>

        </div>

        <div className="progress-bar">

          <div
            className="progress-fill"
            style={{
              width: loading
                ? "0%"
                : `${overallProgress}%`,
            }}
          />

        </div>

      </div>

    </div>
  )
}

export default Overview