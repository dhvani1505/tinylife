import { useEffect, useState } from "react"
import axios from "axios"

type Task = {
  id: number
  title: string
  completed: boolean
}

function Tasks() {
  const [tasks, setTasks] =
    useState<Task[]>([])

  const [newTask, setNewTask] =
    useState("")

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [editingTitle, setEditingTitle] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/tasks")
      .then((response) => {
        setTasks(response.data)
        setError("")
      })
      .catch((error) => {
        console.error(
          "Error fetching tasks:",
          error
        )

        setError(
          "Couldn't load your tasks. Please try again."
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const completedTasks =
    tasks.filter(
      (task) => task.completed
    ).length

  const pendingTasks =
    tasks.length - completedTasks

  const progress =
    tasks.length > 0
      ? Math.round(
          (completedTasks /
            tasks.length) *
            100
        )
      : 0

  const addTask = () => {
    if (newTask.trim() === "") {
      return
    }

    setError("")

    axios
      .post(
        "http://localhost:5000/api/tasks",
        {
          title: newTask.trim(),
        }
      )
      .then((response) => {
        setTasks(
          (currentTasks) => [
            ...currentTasks,
            response.data,
          ]
        )

        setNewTask("")
      })
      .catch((error) => {
        console.error(
          "Error adding task:",
          error
        )

        setError(
          "Couldn't add the task. Please try again."
        )
      })
  }

  const toggleTask = (
    task: Task
  ) => {
    setError("")

    axios
      .put(
        `http://localhost:5000/api/tasks/${task.id}`,
        {
          completed:
            !task.completed,
        }
      )
      .then((response) => {
        setTasks(
          (currentTasks) =>
            currentTasks.map(
              (item) =>
                item.id === task.id
                  ? response.data
                  : item
            )
        )
      })
      .catch((error) => {
        console.error(
          "Error updating task:",
          error
        )

        setError(
          "Couldn't update the task. Please try again."
        )
      })
  }

  const deleteTask = (
    id: number
  ) => {
    setError("")

    axios
      .delete(
        `http://localhost:5000/api/tasks/${id}`
      )
      .then(() => {
        setTasks(
          (currentTasks) =>
            currentTasks.filter(
              (task) =>
                task.id !== id
            )
        )
      })
      .catch((error) => {
        console.error(
          "Error deleting task:",
          error
        )

        setError(
          "Couldn't delete the task. Please try again."
        )
      })
  }

  const startEditing = (
    id: number,
    title: string
  ) => {
    setEditingId(id)
    setEditingTitle(title)
  }

  const saveEdit = (
    id: number
  ) => {
    if (
      editingTitle.trim() === ""
    ) {
      return
    }

    setError("")

    axios
      .put(
        `http://localhost:5000/api/tasks/${id}`,
        {
          title:
            editingTitle.trim(),
        }
      )
      .then((response) => {
        setTasks(
          (currentTasks) =>
            currentTasks.map(
              (task) =>
                task.id === id
                  ? response.data
                  : task
            )
        )

        setEditingId(null)
        setEditingTitle("")
      })
      .catch((error) => {
        console.error(
          "Error editing task:",
          error
        )

        setError(
          "Couldn't edit the task. Please try again."
        )
      })
  }

  const handleKeyDown = (
    event: React.KeyboardEvent
  ) => {
    if (event.key === "Enter") {
      addTask()
    }
  }

  return (
    <div className="tasks-page">

      <div className="tasks-header">

        <div>
          <h1>
            Tasks
          </h1>

          <p>
            {completedTasks} of{" "}
            {tasks.length} tasks
            completed today.
          </p>
        </div>

        <div className="task-progress-summary">

          <strong>
            {progress}%
          </strong>

          <span>
            complete
          </span>

        </div>

      </div>

      <div className="task-progress-container">

        <div className="task-progress-bar">

          <div
            className="task-progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

        <span>
          {pendingTasks} pending
        </span>

      </div>

      <div className="add-task">

        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTask}
          onChange={(event) =>
            setNewTask(
              event.target.value
            )
          }
          onKeyDown={handleKeyDown}
        />

        <button
          onClick={addTask}
        >
          Add Task
        </button>

      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      <div className="task-list">

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

          <div className="empty-state">

            <div className="empty-icon">
              —
            </div>

            <h3>
              No tasks yet
            </h3>

            <p>
              Add your first task above.
            </p>

          </div>

        ) : (

          tasks.map(
            (task) => (

              <div
                className={
                  task.completed
                    ? "task-item task-item-completed"
                    : "task-item"
                }
                key={task.id}
              >

                {editingId ===
                task.id ? (

                  <div className="edit-task">

                    <input
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
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          saveEdit(
                            task.id
                          )
                        }
                      }}
                    />

                    <button
                      onClick={() =>
                        saveEdit(
                          task.id
                        )
                      }
                    >
                      Save
                    </button>

                    <button
                      onClick={() => {
                        setEditingId(
                          null
                        )
                        setEditingTitle(
                          ""
                        )
                      }}
                    >
                      Cancel
                    </button>

                  </div>

                ) : (

                  <>

                    <label className="task-content">

                      <input
                        type="checkbox"
                        checked={
                          task.completed
                        }
                        onChange={() =>
                          toggleTask(
                            task
                          )
                        }
                      />

                      <span>
                        {task.title}
                      </span>

                    </label>

                    <div className="task-actions">

                      <button
                        className="edit-task-button"
                        onClick={() =>
                          startEditing(
                            task.id,
                            task.title
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-task"
                        onClick={() =>
                          deleteTask(
                            task.id
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
  )
}

export default Tasks