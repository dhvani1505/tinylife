import { useEffect, useState } from "react"
import axios from "axios"

type JournalEntry = {
  id: number
  title: string
  content: string
  date: string
}

function Journal() {
  const [entries, setEntries] =
    useState<JournalEntry[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [title, setTitle] =
    useState("")

  const [content, setContent] =
    useState("")

  const [date, setDate] =
    useState("")

  const [editingId, setEditingId] =
    useState<number | null>(null)

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = () => {
    axios
      .get(
        "http://localhost:5000/api/journal"
      )
      .then((response) => {
        setEntries(response.data)
        setError("")
      })
      .catch((error) => {
        console.error(
          "Error fetching journal entries:",
          error
        )

        setError(
          "Couldn't load your journal. Please try again."
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }

  /* =========================
     STATISTICS
     ========================= */

  const now = new Date()

  const currentMonth =
    now.getMonth()

  const currentYear =
    now.getFullYear()

  const thisMonthEntries =
    entries.filter((entry) => {
      const entryDate =
        new Date(
          entry.date.split("T")[0] +
            "T00:00:00"
        )

      return (
        entryDate.getMonth() ===
          currentMonth &&
        entryDate.getFullYear() ===
          currentYear
      )
    }).length

  const sortedEntries = [
    ...entries,
  ].sort(
    (a, b) =>
      new Date(
        b.date.split("T")[0]
      ).getTime() -
      new Date(
        a.date.split("T")[0]
      ).getTime()
  )

  const latestDate =
    sortedEntries.length > 0
      ? sortedEntries[0].date
      : null

  /* =========================
     DATE FORMAT
     ========================= */

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
     FORM
     ========================= */

  const clearForm = () => {
    setTitle("")
    setContent("")
    setDate("")
    setEditingId(null)
  }

  const saveEntry = () => {
    if (
      title.trim() === "" ||
      content.trim() === ""
    ) {
      return
    }

    if (date === "") {
      return
    }

    setError("")

    if (editingId !== null) {
      axios
        .put(
          `http://localhost:5000/api/journal/${editingId}`,
          {
            title: title.trim(),
            content: content.trim(),
            date,
          }
        )
        .then((response) => {
          setEntries(
            (currentEntries) =>
              currentEntries.map(
                (entry) =>
                  entry.id ===
                  editingId
                    ? response.data
                    : entry
              )
          )

          clearForm()
        })
        .catch((error) => {
          console.error(
            "Error updating journal entry:",
            error
          )

          setError(
            "Couldn't update the journal entry. Please try again."
          )
        })

      return
    }

    axios
      .post(
        "http://localhost:5000/api/journal",
        {
          title: title.trim(),
          content: content.trim(),
          date,
        }
      )
      .then((response) => {
        setEntries(
          (currentEntries) => [
            response.data,
            ...currentEntries,
          ]
        )

        clearForm()
      })
      .catch((error) => {
        console.error(
          "Error adding journal entry:",
          error
        )

        setError(
          "Couldn't add the journal entry. Please try again."
        )
      })
  }

  const editEntry = (
    entry: JournalEntry
  ) => {
    setTitle(entry.title)
    setContent(entry.content)

    setDate(
      entry.date.split("T")[0]
    )

    setEditingId(entry.id)

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const deleteEntry = (
    id: number
  ) => {
    setError("")

    axios
      .delete(
        `http://localhost:5000/api/journal/${id}`
      )
      .then(() => {
        setEntries(
          (currentEntries) =>
            currentEntries.filter(
              (entry) =>
                entry.id !== id
            )
        )

        if (editingId === id) {
          clearForm()
        }
      })
      .catch((error) => {
        console.error(
          "Error deleting journal entry:",
          error
        )

        setError(
          "Couldn't delete the journal entry. Please try again."
        )
      })
  }

  return (
    <div className="journal-page">

      <div className="journal-header">

        <div>

          <h1>
            Journal
          </h1>

          <p>
            A little space to write down
            your thoughts.
          </p>

        </div>

        <div className="journal-header-stat">

          <strong>
            {entries.length}
          </strong>

          <span>
            {entries.length === 1
              ? "entry"
              : "entries"}
          </span>

        </div>

      </div>

      {/* STATISTICS */}

      <div className="journal-stats">

        <div className="journal-stat-card">

          <span>
            Total Entries
          </span>

          <strong>
            {entries.length}
          </strong>

        </div>

        <div className="journal-stat-card">

          <span>
            This Month
          </span>

          <strong>
            {thisMonthEntries}
          </strong>

        </div>

        <div className="journal-stat-card">

          <span>
            Latest Entry
          </span>

          <strong>
            {latestDate
              ? formatDate(
                  latestDate
                )
              : "—"}
          </strong>

        </div>

      </div>

      {/* JOURNAL FORM */}

      <div className="journal-form">

        <div className="journal-form-header">

          <h2>
            {editingId !== null
              ? "Edit Entry"
              : "Write Something"}
          </h2>

          <p>
            {editingId !== null
              ? "Update your journal entry."
              : "Take a moment to write down your thoughts."}
          </p>

        </div>

        <input
          type="text"
          placeholder="Journal title..."
          value={title}
          onChange={(event) =>
            setTitle(
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

        <textarea
          placeholder="Write your thoughts..."
          value={content}
          onChange={(event) =>
            setContent(
              event.target.value
            )
          }
        />

        <div className="journal-actions">

          <button
            onClick={
              saveEntry
            }
          >
            {editingId !== null
              ? "Update Entry"
              : "Add Entry"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={
                clearForm
              }
            >
              Cancel
            </button>
          )}

        </div>

      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      {/* ENTRIES */}

      <div className="journal-section">

        <div className="journal-section-header">

          <div>

            <h2>
              Your Journal
            </h2>

            <p>
              Your thoughts and memories,
              all in one place.
            </p>

          </div>

        </div>

        <div className="journal-list">

          {loading ? (

            <div className="empty-state">

              <h3>
                Loading journal...
              </h3>

              <p>
                Just a moment.
              </p>

            </div>

          ) : entries.length === 0 ? (

            <div className="empty-state">

              <h3>
                No journal entries yet
              </h3>

              <p>
                Write something above to
                start your journal.
              </p>

            </div>

          ) : (

            sortedEntries.map(
              (entry) => (

                <div
                  className="journal-entry"
                  key={entry.id}
                >

                  <div className="journal-entry-content">

                    <div className="journal-entry-top">

                      <h2>
                        {entry.title}
                      </h2>

                      <span className="journal-date">
                        {formatDate(
                          entry.date
                        )}
                      </span>

                    </div>

                    <p className="journal-text">
                      {entry.content}
                    </p>

                  </div>

                  <div className="journal-entry-actions">

                    <button
                      onClick={() =>
                        editEntry(
                          entry
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-journal"
                      onClick={() =>
                        deleteEntry(
                          entry.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              )
            )

          )}

        </div>

      </div>

    </div>
  )
}

export default Journal