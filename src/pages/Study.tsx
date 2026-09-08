import { useEffect, useState } from "react"
import axios from "axios"

type StudySession = {
  id: number
  minutes: number
  date: string
}

type TimerState = {
  status: "running" | "paused"
  startedAt: number | null
  elapsedBeforePause: number
}

const TIMER_STORAGE_KEY =
  "tinylife-study-timer"

function Study() {
  const [sessions, setSessions] =
    useState<StudySession[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [minutes, setMinutes] =
    useState("")

  const [date, setDate] =
    useState("")

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [editingMinutes, setEditingMinutes] =
    useState("")

  const [editingDate, setEditingDate] =
    useState("")

  const [timerStatus, setTimerStatus] =
    useState<
      "idle" | "running" | "paused"
    >("idle")

  const [startedAt, setStartedAt] =
    useState<number | null>(null)

  const [elapsedBeforePause, setElapsedBeforePause] =
    useState(0)

  const [currentTime, setCurrentTime] =
    useState(Date.now())

  /* =========================
     FETCH STUDY SESSIONS
     ========================= */

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/study")
      .then((response) => {
        setSessions(response.data)
        setError("")
      })
      .catch((error) => {
        console.error(
          "Error fetching study sessions:",
          error
        )

        setError(
          "Couldn't load your study sessions. Please try again."
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  /* =========================
     RESTORE TIMER
     ========================= */

  useEffect(() => {
    const savedTimer =
      localStorage.getItem(
        TIMER_STORAGE_KEY
      )

    if (!savedTimer) {
      return
    }

    try {
      const timer: TimerState =
        JSON.parse(savedTimer)

      if (timer.status === "running") {
        setTimerStatus("running")
      } else {
        setTimerStatus("paused")
      }

      setStartedAt(timer.startedAt)

      setElapsedBeforePause(
        timer.elapsedBeforePause
      )
    } catch (error) {
      console.error(
        "Error restoring study timer:",
        error
      )

      localStorage.removeItem(
        TIMER_STORAGE_KEY
      )
    }
  }, [])

  /* =========================
     SAVE TIMER
     ========================= */

  useEffect(() => {
    if (timerStatus === "idle") {
      localStorage.removeItem(
        TIMER_STORAGE_KEY
      )

      return
    }

    const timerState: TimerState = {
      status:
        timerStatus === "running"
          ? "running"
          : "paused",

      startedAt,

      elapsedBeforePause,
    }

    localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify(timerState)
    )
  }, [
    timerStatus,
    startedAt,
    elapsedBeforePause,
  ])

  /* =========================
     TIMER TICK
     ========================= */

  useEffect(() => {
    if (timerStatus !== "running") {
      return
    }

    const interval =
      window.setInterval(() => {
        setCurrentTime(Date.now())
      }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [timerStatus])

  /* =========================
     TIMER CALCULATION
     ========================= */

  const getElapsedMilliseconds = () => {
    if (
      timerStatus === "running" &&
      startedAt !== null
    ) {
      return (
        elapsedBeforePause +
        (currentTime - startedAt)
      )
    }

    return elapsedBeforePause
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      getElapsedMilliseconds() / 1000
    )
  )

  const timerHours =
    Math.floor(
      elapsedSeconds / 3600
    )

  const timerMinutes =
    Math.floor(
      (elapsedSeconds % 3600) / 60
    )

  const timerSeconds =
    elapsedSeconds % 60

  /* =========================
     DATE HELPERS
     ========================= */

  const getToday = () => {
    const now = new Date()

    const year =
      now.getFullYear()

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0")

    const day = String(
      now.getDate()
    ).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  const formatDate = (
    dateString: string
  ) => {
    const cleanDate =
      dateString.split("T")[0]

    const [
      year,
      month,
      day,
    ] = cleanDate.split("-")

    if (
      !year ||
      !month ||
      !day
    ) {
      return cleanDate
    }

    const dateObject =
      new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      )

    return dateObject.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )
  }

  /* =========================
     START TIMER
     ========================= */

  const startTimer = () => {
    const now = Date.now()

    setStartedAt(now)
    setElapsedBeforePause(0)
    setCurrentTime(now)
    setTimerStatus("running")
  }

  /* =========================
     PAUSE TIMER
     ========================= */

  const pauseTimer = () => {
    if (startedAt === null) {
      return
    }

    const now = Date.now()

    const elapsed =
      elapsedBeforePause +
      (now - startedAt)

    setElapsedBeforePause(elapsed)
    setStartedAt(null)
    setCurrentTime(now)
    setTimerStatus("paused")
  }

  /* =========================
     RESUME TIMER
     ========================= */

  const resumeTimer = () => {
    const now = Date.now()

    setStartedAt(now)
    setCurrentTime(now)
    setTimerStatus("running")
  }

  /* =========================
     STOP TIMER
     ========================= */

  const stopTimer = async () => {
    const elapsedMs =
      getElapsedMilliseconds()

    const studiedMinutes =
      Math.floor(
        elapsedMs / 60000
      )

    if (studiedMinutes <= 0) {
      alert(
        "Study for at least 1 minute before stopping the timer."
      )

      return
    }

    const today = getToday()

    try {
      const response =
        await axios.post(
          "http://localhost:5000/api/study",
          {
            minutes:
              studiedMinutes,
            date: today,
          }
        )

      setSessions(
        (currentSessions) => [
          response.data,
          ...currentSessions,
        ]
      )

      setError("")

      setTimerStatus("idle")
      setStartedAt(null)
      setElapsedBeforePause(0)
      setCurrentTime(Date.now())

      localStorage.removeItem(
        TIMER_STORAGE_KEY
      )
    } catch (error) {
      console.error(
        "Error saving timer session:",
        error
      )

      setError(
        "Could not save the study session. Please try again."
      )
    }
  }

  /* =========================
     STUDY STATISTICS
     ========================= */

  const totalMinutes =
    sessions.reduce(
      (total, session) =>
        total +
        Number(session.minutes),
      0
    )

  const totalHours =
    Math.floor(
      totalMinutes / 60
    )

  const remainingMinutes =
    totalMinutes % 60

  const today = getToday()

  const todayMinutes =
    sessions
      .filter(
        (session) =>
          session.date.split("T")[0] ===
          today
      )
      .reduce(
        (total, session) =>
          total +
          Number(session.minutes),
        0
      )

  const averageMinutes =
    sessions.length > 0
      ? Math.round(
          totalMinutes /
            sessions.length
        )
      : 0

  /* =========================
     MANUAL SESSION
     ========================= */

  const addSession = () => {
    if (
      minutes.trim() === "" ||
      date === ""
    ) {
      return
    }

    const sessionMinutes =
      Number(minutes)

    if (
      !Number.isFinite(
        sessionMinutes
      ) ||
      sessionMinutes <= 0
    ) {
      return
    }

    setError("")

    axios
      .post(
        "http://localhost:5000/api/study",
        {
          minutes:
            sessionMinutes,
          date,
        }
      )
      .then((response) => {
        setSessions(
          (currentSessions) => [
            response.data,
            ...currentSessions,
          ]
        )

        setMinutes("")
        setDate("")
      })
      .catch((error) => {
        console.error(
          "Error adding study session:",
          error
        )

        setError(
          "Couldn't add the study session. Please try again."
        )
      })
  }

  /* =========================
     DELETE SESSION
     ========================= */

  const deleteSession = (
    id: number
  ) => {
    setError("")

    axios
      .delete(
        `http://localhost:5000/api/study/${id}`
      )
      .then(() => {
        setSessions(
          (currentSessions) =>
            currentSessions.filter(
              (session) =>
                session.id !== id
            )
        )
      })
      .catch((error) => {
        console.error(
          "Error deleting study session:",
          error
        )

        setError(
          "Couldn't delete the study session. Please try again."
        )
      })
  }

  /* =========================
     EDIT SESSION
     ========================= */

  const startEditing = (
    session: StudySession
  ) => {
    setEditingId(session.id)

    setEditingMinutes(
      String(session.minutes)
    )

    setEditingDate(
      session.date.split("T")[0]
    )
  }

  const saveEdit = (
    id: number
  ) => {
    if (
      editingMinutes.trim() === "" ||
      editingDate === ""
    ) {
      return
    }

    const updatedMinutes =
      Number(editingMinutes)

    if (
      !Number.isFinite(
        updatedMinutes
      ) ||
      updatedMinutes <= 0
    ) {
      return
    }

    setError("")

    axios
      .put(
        `http://localhost:5000/api/study/${id}`,
        {
          minutes:
            updatedMinutes,
          date: editingDate,
        }
      )
      .then((response) => {
        setSessions(
          (currentSessions) =>
            currentSessions.map(
              (session) =>
                session.id === id
                  ? response.data
                  : session
            )
        )

        setEditingId(null)
        setEditingMinutes("")
        setEditingDate("")
      })
      .catch((error) => {
        console.error(
          "Error editing study session:",
          error
        )

        setError(
          "Couldn't edit the study session. Please try again."
        )
      })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingMinutes("")
    setEditingDate("")
  }

  /* =========================
     UI
     ========================= */

  return (
    <div className="study-page">

      <div className="study-header">

        <div>

          <h1>
            Study
          </h1>

          <p>
            Track your focused study time.
          </p>

        </div>

        <div className="study-header-stat">

          <strong>
            {sessions.length}
          </strong>

          <span>
            {sessions.length === 1
              ? "session"
              : "sessions"}
          </span>

        </div>

      </div>

      {/* STUDY SUMMARY */}

      <div className="study-stats">

        <div className="study-stat-card">

          <span>
            Total Study Time
          </span>

          <strong>
            {totalHours}h{" "}
            {remainingMinutes}m
          </strong>

        </div>

        <div className="study-stat-card">

          <span>
            Today
          </span>

          <strong>
            {Math.floor(
              todayMinutes / 60
            )}h{" "}
            {todayMinutes % 60}m
          </strong>

        </div>

        <div className="study-stat-card">

          <span>
            Average Session
          </span>

          <strong>
            {averageMinutes}m
          </strong>

        </div>

      </div>

      {/* TIMER */}

      <div className="study-timer">

        <div className="timer-label">

          {timerStatus === "running"
            ? "Study session in progress"
            : timerStatus === "paused"
            ? "Study session paused"
            : "Ready to study"}

        </div>

        <div className="timer-display">

          {String(
            timerHours
          ).padStart(2, "0")}

          :

          {String(
            timerMinutes
          ).padStart(2, "0")}

          :

          {String(
            timerSeconds
          ).padStart(2, "0")}

        </div>

        <div className="timer-buttons">

          {timerStatus === "idle" && (
            <button
              onClick={
                startTimer
              }
            >
              Start
            </button>
          )}

          {timerStatus === "running" && (
            <>
              <button
                onClick={
                  pauseTimer
                }
              >
                Pause
              </button>

              <button
                onClick={
                  stopTimer
                }
              >
                Stop
              </button>
            </>
          )}

          {timerStatus === "paused" && (
            <>
              <button
                onClick={
                  resumeTimer
                }
              >
                Resume
              </button>

              <button
                onClick={
                  stopTimer
                }
              >
                Stop
              </button>
            </>
          )}

        </div>

      </div>

      {/* MANUAL SESSION */}

      <div className="add-study">

        <input
          type="number"
          min="1"
          placeholder="Minutes studied..."
          value={minutes}
          onChange={(event) =>
            setMinutes(
              event.target.value
            )
          }
        />

        <input
          type="date"
          value={date}
          onChange={(event) =>
            setDate(
              event.target.value
            )
          }
        />

        <button
          onClick={
            addSession
          }
        >
          Add Study Session
        </button>

      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      {/* SESSION LIST */}

      <div className="study-list">

        {loading ? (

          <div className="empty-state">

            <h3>
              Loading study sessions...
            </h3>

            <p>
              Just a moment.
            </p>

          </div>

        ) : sessions.length === 0 ? (

          <div className="empty-state">

            <h3>
              No study sessions yet
            </h3>

            <p>
              Start the timer or add a
              study session above.
            </p>

          </div>

        ) : (

          sessions.map(
            (session) => (

              <div
                className="study-item"
                key={session.id}
              >

                {editingId ===
                session.id ? (

                  <div className="study-edit">

                    <input
                      type="number"
                      min="1"
                      value={
                        editingMinutes
                      }
                      onChange={(event) =>
                        setEditingMinutes(
                          event.target.value
                        )
                      }
                    />

                    <input
                      type="date"
                      value={
                        editingDate
                      }
                      onChange={(event) =>
                        setEditingDate(
                          event.target.value
                        )
                      }
                    />

                    <button
                      onClick={() =>
                        saveEdit(
                          session.id
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

                    <div className="study-info">

                      <h3>
                        {session.minutes}{" "}
                        {Number(
                          session.minutes
                        ) === 1
                          ? "minute"
                          : "minutes"}
                      </h3>

                      <p>
                        {formatDate(
                          session.date
                        )}
                      </p>

                    </div>

                    <div className="study-actions">

                      <button
                        onClick={() =>
                          startEditing(
                            session
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-study"
                        onClick={() =>
                          deleteSession(
                            session.id
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

export default Study