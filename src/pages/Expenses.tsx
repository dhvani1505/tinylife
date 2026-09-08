import { useEffect, useState } from "react"
import axios from "axios"

type Expense = {
  id: number
  title: string
  amount: number
  date: string
}

function Expenses() {
  const [expenses, setExpenses] =
    useState<Expense[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [title, setTitle] =
    useState("")

  const [amount, setAmount] =
    useState("")

  const [date, setDate] =
    useState("")

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [editingTitle, setEditingTitle] =
    useState("")

  const [editingAmount, setEditingAmount] =
    useState("")

  const [editingDate, setEditingDate] =
    useState("")

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/expenses")
      .then((response) => {
        setExpenses(response.data)
        setError("")
      })
      .catch((error) => {
        console.error(
          "Error fetching expenses:",
          error
        )

        setError(
          "Couldn't load your expenses. Please try again."
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  /* =========================
     STATISTICS
     ========================= */

  const totalExpenses =
    expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount),
      0
    )

  const today = new Date()

  const currentMonth =
    today.getMonth()

  const currentYear =
    today.getFullYear()

  const monthlyExpenses =
    expenses.filter((expense) => {
      const expenseDate =
        new Date(
          expense.date.split("T")[0] +
            "T00:00:00"
        )

      return (
        expenseDate.getMonth() ===
          currentMonth &&
        expenseDate.getFullYear() ===
          currentYear
      )
    })

  const thisMonthTotal =
    monthlyExpenses.reduce(
      (total, expense) =>
        total + Number(expense.amount),
      0
    )

  const averageExpense =
    expenses.length > 0
      ? totalExpenses / expenses.length
      : 0

  /* =========================
     MONTHLY HISTORY
     ========================= */

  const monthlyTotals =
    expenses.reduce(
      (
        groups: Record<
          string,
          number
        >,
        expense
      ) => {
        const cleanDate =
          expense.date.split("T")[0]

        const [
          year,
          month,
        ] = cleanDate.split("-")

        const key =
          `${year}-${month}`

        if (!groups[key]) {
          groups[key] = 0
        }

        groups[key] +=
          Number(expense.amount)

        return groups
      },
      {}
    )

  const sortedMonths =
    Object.keys(
      monthlyTotals
    ).sort((a, b) =>
      b.localeCompare(a)
    )

  const formatMonth = (
    monthString: string
  ) => {
    const [
      year,
      month,
    ] = monthString.split("-")

    const dateObject =
      new Date(
        Number(year),
        Number(month) - 1,
        1
      )

    return dateObject.toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    )
  }

  /* =========================
     ADD EXPENSE
     ========================= */

  const addExpense = () => {
    if (
      title.trim() === "" ||
      amount.trim() === "" ||
      date === ""
    ) {
      return
    }

    const expenseAmount =
      Number(amount)

    if (
      !Number.isFinite(
        expenseAmount
      ) ||
      expenseAmount <= 0
    ) {
      return
    }

    setError("")

    axios
      .post(
        "http://localhost:5000/api/expenses",
        {
          title: title.trim(),
          amount: expenseAmount,
          date,
        }
      )
      .then((response) => {
        setExpenses(
          (currentExpenses) => [
            response.data,
            ...currentExpenses,
          ]
        )

        setTitle("")
        setAmount("")
        setDate("")
      })
      .catch((error) => {
        console.error(
          "Error adding expense:",
          error
        )

        setError(
          "Couldn't add the expense. Please try again."
        )
      })
  }

  /* =========================
     DELETE EXPENSE
     ========================= */

  const deleteExpense = (
    id: number
  ) => {
    setError("")

    axios
      .delete(
        `http://localhost:5000/api/expenses/${id}`
      )
      .then(() => {
        setExpenses(
          (currentExpenses) =>
            currentExpenses.filter(
              (expense) =>
                expense.id !== id
            )
        )
      })
      .catch((error) => {
        console.error(
          "Error deleting expense:",
          error
        )

        setError(
          "Couldn't delete the expense. Please try again."
        )
      })
  }

  /* =========================
     EDIT EXPENSE
     ========================= */

  const startEditing = (
    expense: Expense
  ) => {
    setEditingId(expense.id)

    setEditingTitle(
      expense.title
    )

    setEditingAmount(
      String(expense.amount)
    )

    setEditingDate(
      expense.date.split("T")[0]
    )
  }

  const saveEdit = (
    id: number
  ) => {
    if (
      editingTitle.trim() === "" ||
      editingAmount.trim() === "" ||
      editingDate === ""
    ) {
      return
    }

    const updatedAmount =
      Number(editingAmount)

    if (
      !Number.isFinite(
        updatedAmount
      ) ||
      updatedAmount <= 0
    ) {
      return
    }

    setError("")

    axios
      .put(
        `http://localhost:5000/api/expenses/${id}`,
        {
          title:
            editingTitle.trim(),
          amount:
            updatedAmount,
          date:
            editingDate,
        }
      )
      .then((response) => {
        setExpenses(
          (currentExpenses) =>
            currentExpenses.map(
              (expense) =>
                expense.id === id
                  ? response.data
                  : expense
            )
        )

        setEditingId(null)
        setEditingTitle("")
        setEditingAmount("")
        setEditingDate("")
      })
      .catch((error) => {
        console.error(
          "Error editing expense:",
          error
        )

        setError(
          "Couldn't edit the expense. Please try again."
        )
      })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingTitle("")
    setEditingAmount("")
    setEditingDate("")
  }

  /* =========================
     FORMAT DATE
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

  return (
    <div className="expenses-page">

      <div className="expenses-header">

        <div>

          <h1>
            Expenses
          </h1>

          <p>
            Keep track of where your
            money goes.
          </p>

        </div>

        <div className="expense-header-stat">

          <strong>
            {expenses.length}
          </strong>

          <span>
            {expenses.length === 1
              ? "expense"
              : "expenses"}
          </span>

        </div>

      </div>

      {/* STATISTICS */}

      <div className="expense-stats">

        <div className="expense-stat-card">

          <span>
            Total Spending
          </span>

          <strong>
            ₹{totalExpenses.toFixed(2)}
          </strong>

        </div>

        <div className="expense-stat-card">

          <span>
            This Month
          </span>

          <strong>
            ₹{thisMonthTotal.toFixed(2)}
          </strong>

        </div>

        <div className="expense-stat-card">

          <span>
            Average Expense
          </span>

          <strong>
            ₹{averageExpense.toFixed(2)}
          </strong>

        </div>

      </div>

      {/* ADD EXPENSE */}

      <div className="add-expense">

        <input
          type="text"
          placeholder="Expense name..."
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
        />

        <input
          type="number"
          min="1"
          placeholder="Amount..."
          value={amount}
          onChange={(event) =>
            setAmount(
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
            addExpense
          }
        >
          Add Expense
        </button>

      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      {/* MONTHLY HISTORY */}

      {!loading &&
        sortedMonths.length > 0 && (

          <div className="expense-history">

            <div className="expense-history-header">

              <div>

                <h2>
                  Spending History
                </h2>

                <p>
                  See how much you spent
                  each month.
                </p>

              </div>

            </div>

            <div className="expense-history-list">

              {sortedMonths.map(
                (month) => (

                  <div
                    className="expense-month"
                    key={month}
                  >

                    <div>

                      <h3>
                        {formatMonth(
                          month
                        )}
                      </h3>

                      <span>
                        Monthly spending
                      </span>

                    </div>

                    <strong>
                      ₹
                      {monthlyTotals[
                        month
                      ].toFixed(2)}
                    </strong>

                  </div>

                )
              )}

            </div>

          </div>

        )}

      {/* EXPENSE LIST */}

      <div className="expense-section">

        <div className="expense-history-header">

          <div>

            <h2>
              All Expenses
            </h2>

            <p>
              Edit or delete individual
              expenses.
            </p>

          </div>

        </div>

        <div className="expense-list">

          {loading ? (

            <div className="empty-state">

              <h3>
                Loading expenses...
              </h3>

              <p>
                Just a moment.
              </p>

            </div>

          ) : expenses.length === 0 ? (

            <div className="empty-state">

              <h3>
                No expenses yet
              </h3>

              <p>
                Add an expense above
                to start tracking
                your spending.
              </p>

            </div>

          ) : (

            expenses.map(
              (expense) => (

                <div
                  className="expense-item"
                  key={expense.id}
                >

                  {editingId ===
                  expense.id ? (

                    <div className="expense-edit">

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
                        min="1"
                        value={
                          editingAmount
                        }
                        onChange={(
                          event
                        ) =>
                          setEditingAmount(
                            event.target
                              .value
                          )
                        }
                      />

                      <input
                        type="date"
                        value={
                          editingDate
                        }
                        onChange={(
                          event
                        ) =>
                          setEditingDate(
                            event.target
                              .value
                          )
                        }
                      />

                      <button
                        onClick={() =>
                          saveEdit(
                            expense.id
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

                      <div className="expense-info">

                        <h3>
                          {expense.title}
                        </h3>

                        <p>
                          {formatDate(
                            expense.date
                          )}
                        </p>

                      </div>

                      <div className="expense-right">

                        <strong>
                          ₹
                          {Number(
                            expense.amount
                          ).toFixed(2)}
                        </strong>

                        <button
                          onClick={() =>
                            startEditing(
                              expense
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-expense"
                          onClick={() =>
                            deleteExpense(
                              expense.id
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

export default Expenses