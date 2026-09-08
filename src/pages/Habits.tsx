import { useEffect, useState } from "react"
import axios from "axios"

type Habit = {
  id: number
  name: string
  completed: boolean
  streak: number
  last_completed_date: string | null
}

function Habits() {
  const [habits, setHabits] =
    useState<Habit[]>([])

  const [newHabit, setNewHabit] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/habits")
      .then((response) => {
        setHabits(response.data)
        setError("")
      })
      .catch((error) => {
        console.error(
          "Error fetching habits:",
          error
        )

        setError(
          "Couldn't load your habits. Please try again."
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const completedHabits =
    habits.filter(
      (habit) => habit.completed
    ).length

  const pendingHabits =
    habits.length - completedHabits

  const progress =
    habits.length > 0
      ? Math.round(
          (completedHabits /
            habits.length) *
            100
        )
      : 0

  const addHabit = () => {
    if (newHabit.trim() === "") {
      return
    }

    setError("")

    axios
      .post(
        "http://localhost:5000/api/habits",
        {
          name: newHabit.trim(),
        }
      )
      .then((response) => {
        setHabits(
          (currentHabits) => [
            ...currentHabits,
            response.data,
          ]
        )

        setNewHabit("")
      })
      .catch((error) => {
        console.error(
          "Error adding habit:",
          error
        )

        setError(
          "Couldn't add the habit. Please try again."
        )
      })
  }

  const toggleHabit = (
    habit: Habit
  ) => {
    setError("")

    axios
      .put(
        `http://localhost:5000/api/habits/${habit.id}`,
        {
          completed:
            !habit.completed,
        }
      )
      .then((response) => {
        setHabits(
          (currentHabits) =>
            currentHabits.map(
              (item) =>
                item.id === habit.id
                  ? response.data
                  : item
            )
        )
      })
      .catch((error) => {
        console.error(
          "Error updating habit:",
          error
        )

        setError(
          "Couldn't update the habit. Please try again."
        )
      })
  }

  const deleteHabit = (
    id: number
  ) => {
    setError("")

    axios
      .delete(
        `http://localhost:5000/api/habits/${id}`
      )
      .then(() => {
        setHabits(
          (currentHabits) =>
            currentHabits.filter(
              (habit) =>
                habit.id !== id
            )
        )
      })
      .catch((error) => {
        console.error(
          "Error deleting habit:",
          error
        )

        setError(
          "Couldn't delete the habit. Please try again."
        )
      })
  }

  const handleKeyDown = (
    event: React.KeyboardEvent
  ) => {
    if (event.key === "Enter") {
      addHabit()
    }
  }

  return (
    <div className="habits-page">

      <div className="habits-header">

        <div>
          <h1>
            Habits
          </h1>

          <p>
            Small things, done consistently.
          </p>
        </div>

        <div className="habit-progress-summary">

          <strong>
            {progress}%
          </strong>

          <span>
            complete
          </span>

        </div>

      </div>

      <div className="habit-progress-container">

        <div className="habit-progress-bar">

          <div
            className="habit-progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

        <span>
          {pendingHabits} remaining
        </span>

      </div>

      <div className="add-habit">

        <input
          type="text"
          placeholder="Add a new habit..."
          value={newHabit}
          onChange={(event) =>
            setNewHabit(
              event.target.value
            )
          }
          onKeyDown={handleKeyDown}
        />

        <button
          onClick={addHabit}
        >
          Add Habit
        </button>

      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      <div className="habit-list">

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

          <div className="empty-state">

            <div className="empty-icon">
              —
            </div>

            <h3>
              No habits yet
            </h3>

            <p>
              Add a habit above to start
              building your routine.
            </p>

          </div>

        ) : (

          habits.map(
            (habit) => (

              <div
                className={
                  habit.completed
                    ? "habit-item habit-item-completed"
                    : "habit-item"
                }
                key={habit.id}
              >

                <div className="habit-left">

                  <input
                    type="checkbox"
                    checked={
                      habit.completed
                    }
                    onChange={() =>
                      toggleHabit(
                        habit
                      )
                    }
                  />

                  <div className="habit-details">

                    <h3>
                      {habit.name}
                    </h3>

                    <div className="habit-meta">

                      <span>
                        {habit.streak}{" "}
                        day streak
                      </span>

                      {habit.completed && (
                        <span className="habit-status">
                          Completed today
                        </span>
                      )}

                    </div>

                    {habit.last_completed_date && (
                      <p>
                        Last completed:{" "}
                        {new Date(
                          habit.last_completed_date
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    )}

                  </div>

                </div>

                <button
                  className="delete-habit"
                  onClick={() =>
                    deleteHabit(
                      habit.id
                    )
                  }
                >
                  Delete
                </button>

              </div>

            )
          )

        )}

      </div>

    </div>
  )
}

export default Habits