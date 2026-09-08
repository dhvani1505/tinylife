import { useEffect, useState } from "react"
import axios from "axios"

type Goal = {
  id: number
  title: string
  progress: number
}

function Goals() {
  const [goals, setGoals] =
    useState<Goal[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [title, setTitle] =
    useState("")

  const [progress, setProgress] =
    useState("0")

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [editingTitle, setEditingTitle] =
    useState("")

  const [editingProgress, setEditingProgress] =
    useState("")

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/goals")
      .then((response) => {
        setGoals(response.data)
        setError("")
      })
      .catch((error) => {
        console.error(
          "Error fetching goals:",
          error
        )

        setError(
          "Couldn't load your goals. Please try again."
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  /* =========================
     STATISTICS
     ========================= */

  const averageProgress =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce(
            (total, goal) =>
              total +
              Number(goal.progress),
            0
          ) / goals.length
        )

  const completedGoals =
    goals.filter(
      (goal) =>
        Number(goal.progress) >= 100
    ).length

  const inProgressGoals =
    goals.filter(
      (goal) =>
        Number(goal.progress) > 0 &&
        Number(goal.progress) < 100
    ).length

  /* =========================
     ADD GOAL
     ========================= */

  const addGoal = () => {
    if (title.trim() === "") {
      return
    }

    const goalProgress =
      Math.min(
        100,
        Math.max(
          0,
          Number(progress)
        )
      )

    if (
      !Number.isFinite(
        goalProgress
      )
    ) {
      return
    }

    setError("")

    axios
      .post(
        "http://localhost:5000/api/goals",
        {
          title: title.trim(),
          progress: goalProgress,
        }
      )
      .then((response) => {
        setGoals(
          (currentGoals) => [
            ...currentGoals,
            response.data,
          ]
        )

        setTitle("")
        setProgress("0")
      })
      .catch((error) => {
        console.error(
          "Error adding goal:",
          error
        )

        setError(
          "Couldn't add the goal. Please try again."
        )
      })
  }

  /* =========================
     EDIT GOAL
     ========================= */

  const startEditing = (
    goal: Goal
  ) => {
    setEditingId(goal.id)

    setEditingTitle(
      goal.title
    )

    setEditingProgress(
      String(goal.progress)
    )
  }

  const saveEdit = (
    id: number
  ) => {
    if (
      editingTitle.trim() === ""
    ) {
      return
    }

    const goalProgress =
      Math.min(
        100,
        Math.max(
          0,
          Number(
            editingProgress
          )
        )
      )

    if (
      !Number.isFinite(
        goalProgress
      )
    ) {
      return
    }

    setError("")

    axios
      .put(
        `http://localhost:5000/api/goals/${id}`,
        {
          title:
            editingTitle.trim(),
          progress:
            goalProgress,
        }
      )
      .then((response) => {
        setGoals(
          (currentGoals) =>
            currentGoals.map(
              (goal) =>
                goal.id === id
                  ? response.data
                  : goal
            )
        )

        setEditingId(null)
        setEditingTitle("")
        setEditingProgress("")
      })
      .catch((error) => {
        console.error(
          "Error updating goal:",
          error
        )

        setError(
          "Couldn't update the goal. Please try again."
        )
      })
  }

  /* =========================
     DELETE GOAL
     ========================= */

  const deleteGoal = (
    id: number
  ) => {
    setError("")

    axios
      .delete(
        `http://localhost:5000/api/goals/${id}`
      )
      .then(() => {
        setGoals(
          (currentGoals) =>
            currentGoals.filter(
              (goal) =>
                goal.id !== id
            )
        )
      })
      .catch((error) => {
        console.error(
          "Error deleting goal:",
          error
        )

        setError(
          "Couldn't delete the goal. Please try again."
        )
      })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingTitle("")
    setEditingProgress("")
  }

  /* =========================
     UI
     ========================= */

  return (
    <div className="goals-page">

      <div className="goals-header">

        <div>

          <h1>
            Goals
          </h1>

          <p>
            Keep moving toward the
            things that matter.
          </p>

        </div>

        <div className="goals-header-stat">

          <strong>
            {averageProgress}%
          </strong>

          <span>
            overall progress
          </span>

        </div>

      </div>

      {/* STATISTICS */}

      <div className="goals-summary">

        <div className="goal-stat-card">

          <span>
            Total Goals
          </span>

          <strong>
            {goals.length}
          </strong>

        </div>

        <div className="goal-stat-card">

          <span>
            In Progress
          </span>

          <strong>
            {inProgressGoals}
          </strong>

        </div>

        <div className="goal-stat-card">

          <span>
            Completed
          </span>

          <strong>
            {completedGoals}
          </strong>

        </div>

      </div>

      {/* OVERALL PROGRESS */}

      {!loading &&
        goals.length > 0 && (

          <div className="goals-overall">

            <div className="goals-overall-header">

              <span>
                Overall Progress
              </span>

              <strong>
                {averageProgress}%
              </strong>

            </div>

            <div className="goals-overall-bar">

              <div
                className="goals-overall-fill"
                style={{
                  width:
                    `${averageProgress}%`,
                }}
              />

            </div>

          </div>

        )}

      {/* ADD GOAL */}

      <div className="add-goal">

        <input
          type="text"
          placeholder="Goal name..."
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
        />

        <input
          type="number"
          min="0"
          max="100"
          placeholder="Progress %"
          value={progress}
          onChange={(event) =>
            setProgress(
              event.target.value
            )
          }
        />

        <button
          onClick={
            addGoal
          }
        >
          Add Goal
        </button>

      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      {/* GOAL LIST */}

      <div className="goal-section">

        <div className="goal-section-header">

          <div>

            <h2>
              Your Goals
            </h2>

            <p>
              Track your progress
              toward each goal.
            </p>

          </div>

        </div>

        <div className="goal-list">

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

            <div className="empty-state">

              <h3>
                No goals yet
              </h3>

              <p>
                Add your first goal
                above.
              </p>

            </div>

          ) : (

            goals.map(
              (goal) => (

                <div
                  className="goal-item"
                  key={goal.id}
                >

                  {editingId ===
                  goal.id ? (

                    <div className="goal-edit">

                      <input
                        type="text"
                        value={
                          editingTitle
                        }
                        onChange={(
                          event
                        ) =>
                          setEditingTitle(
                            event.target
                              .value
                          )
                        }
                      />

                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={
                          editingProgress
                        }
                        onChange={(
                          event
                        ) =>
                          setEditingProgress(
                            event.target
                              .value
                          )
                        }
                      />

                      <button
                        onClick={() =>
                          saveEdit(
                            goal.id
                          )
                        }
                      >
                        Save
                      </button>

                      <button
                        onClick={
                          cancelEdit
                        }
                      >
                        Cancel
                      </button>

                    </div>

                  ) : (

                    <>

                      <div className="goal-info">

                        <div className="goal-title-row">

                          <h3>
                            {goal.title}
                          </h3>

                          <strong>
                            {goal.progress}%
                          </strong>

                        </div>

                        <div className="goal-progress">

                          <div
                            className="goal-progress-fill"
                            style={{
                              width:
                                `${goal.progress}%`,
                            }}
                          />

                        </div>

                        <span className="goal-status">

                          {Number(
                            goal.progress
                          ) >= 100
                            ? "Completed"
                            : Number(
                                goal.progress
                              ) > 0
                            ? "In progress"
                            : "Not started"}

                        </span>

                      </div>

                      <div className="goal-actions">

                        <button
                          onClick={() =>
                            startEditing(
                              goal
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-goal"
                          onClick={() =>
                            deleteGoal(
                              goal.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </>

                  )}

                </div>

              )
            )

          )}

        </div>

      </div>

    </div>
  )
}

export default Goals