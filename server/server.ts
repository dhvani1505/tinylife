import express from "express"
import cors from "cors"
import pool from "./db"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import authenticateToken, {
  AuthRequest,
} from "./authMiddleware"

const app = express()

const PORT = Number(process.env.PORT) || 5000

app.use(cors())
app.use(express.json())

// ==================================================
// REGISTER
// ==================================================

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({
      message:
        "Name, email and password are required",
    })
  }

  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    )

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email is already registered",
      })
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    )

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword]
    )

    res.status(201).json({
      message: "Registration successful",
      user: result.rows[0],
    })
  } catch (error) {
    console.error(
      "Error registering user:",
      error
    )

    res.status(500).json({
      message: "Server error",
    })
  }
})

// ==================================================
// LOGIN
// ==================================================

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    })
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password
       FROM users
       WHERE email = $1`,
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      })
    }

    const user = result.rows[0]

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    )

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      })
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    )

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error(
      "Error logging in:",
      error
    )

    res.status(500).json({
      message: "Server error",
    })
  }
})

// ==================================================
// FORGOT PASSWORD
// ==================================================

app.post(
  "/api/forgot-password",
  async (req, res) => {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      })
    }

    try {
      const result = await pool.query(
        `SELECT id
         FROM users
         WHERE email = $1`,
        [email]
      )

      // Always return the same message so an email
      // address cannot be used to discover accounts.
      const genericMessage =
        "If an account exists with this email, a password reset link has been generated."

      if (result.rows.length === 0) {
        return res.json({
          message: genericMessage,
        })
      }

      const userId = result.rows[0].id

      const resetToken =
        crypto.randomBytes(32).toString("hex")

      const resetTokenExpires =
        new Date(
          Date.now() + 15 * 60 * 1000
        )

      await pool.query(
        `UPDATE users
         SET reset_token = $1,
             reset_token_expires = $2
         WHERE id = $3`,
        [
          resetToken,
          resetTokenExpires,
          userId,
        ]
      )

      const appUrl =
        process.env.APP_URL ||
        "http://localhost:5173"

      const resetLink =
        `${appUrl}/reset-password?token=${resetToken}`

      const resendResponse =
        await fetch(
          "https://api.resend.com/emails",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from:
                process.env.RESEND_FROM_EMAIL ||
                "TinyLife <onboarding@resend.dev>",
              to: [email],
              subject:
                "Reset your TinyLife password",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                  <h2>Reset your TinyLife password</h2>
                  <p>We received a request to reset your TinyLife password.</p>
                  <p>
                    <a
                      href="${resetLink}"
                      style="display: inline-block; padding: 12px 18px; background: #d6a56d; color: white; text-decoration: none; border-radius: 8px;"
                    >
                      Reset Password
                    </a>
                  </p>
                  <p>This link will expire in 15 minutes.</p>
                  <p>If you didn't request this, you can safely ignore this email.</p>
                </div>
              `,
            }),
          }
        )

      if (!resendResponse.ok) {
        const resendError =
          await resendResponse.text()

        console.error(
          "Resend email error:",
          resendError
        )

        return res.status(500).json({
          message:
            "Unable to send the password reset email. Please try again.",
        })
      }

      res.json({
        message: genericMessage,
      })
    } catch (error) {
      console.error(
        "Error creating password reset token:",
        error
      )

      res.status(500).json({
        message:
          "Something went wrong. Please try again.",
      })
    }
  }
)

// ==================================================
// RESET PASSWORD
// ==================================================

app.post(
  "/api/reset-password",
  async (req, res) => {
    const {
      token,
      newPassword,
      confirmPassword,
    } = req.body

    if (
      !token ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message:
          "Token and all password fields are required.",
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message:
          "New passwords do not match.",
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "New password must be at least 6 characters.",
      })
    }

    try {
      const result = await pool.query(
        `SELECT id
         FROM users
         WHERE reset_token = $1
           AND reset_token_expires > CURRENT_TIMESTAMP`,
        [token]
      )

      if (result.rows.length === 0) {
        return res.status(400).json({
          message:
            "This password reset link is invalid or has expired.",
        })
      }

      const userId = result.rows[0].id

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          10
        )

      await pool.query(
        `UPDATE users
         SET password = $1,
             reset_token = NULL,
             reset_token_expires = NULL
         WHERE id = $2`,
        [
          hashedPassword,
          userId,
        ]
      )

      res.json({
        message:
          "Password reset successfully.",
      })
    } catch (error) {
      console.error(
        "Error resetting password:",
        error
      )

      res.status(500).json({
        message:
          "Failed to reset password.",
      })
    }
  }
)

// ==================================================
// HOME
// ==================================================

app.get("/", (req, res) => {
  res.json({
    message: "TinyLife backend is running!",
  })
})

// ==================================================
// PROTECTED API ROUTES
// ==================================================

app.use("/api/tasks", authenticateToken)
app.use("/api/habits", authenticateToken)
app.use("/api/study", authenticateToken)
app.use("/api/expenses", authenticateToken)
app.use("/api/goals", authenticateToken)
app.use("/api/journal", authenticateToken)
app.use("/api/data", authenticateToken)
app.use("/api/profile", authenticateToken)

// ==================================================
// PROFILE
// ==================================================

app.put("/api/profile", async (req, res) => {
  const userId = (req as AuthRequest).userId
  const { name } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({
      message: "Name is required",
    })
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1
       WHERE id = $2
       RETURNING id, name, email`,
      [name.trim(), userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    })
  } catch (error) {
    console.error(
      "Error updating profile:",
      error
    )

    res.status(500).json({
      message: "Failed to update profile",
    })
  }
})

// ==================================================
// CHANGE PASSWORD
// ==================================================

app.put(
  "/api/profile/password",
  async (req, res) => {
    const userId = (req as AuthRequest).userId

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message:
          "All password fields are required",
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match",
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "New password must be at least 6 characters",
      })
    }

    try {
      const result = await pool.query(
        `SELECT password
         FROM users
         WHERE id = $1`,
        [userId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "User not found",
        })
      }

      const passwordMatch =
        await bcrypt.compare(
          currentPassword,
          result.rows[0].password
        )

      if (!passwordMatch) {
        return res.status(401).json({
          message:
            "Current password is incorrect",
        })
      }

      const hashedPassword =
        await bcrypt.hash(newPassword, 10)

      await pool.query(
        `UPDATE users
         SET password = $1
         WHERE id = $2`,
        [hashedPassword, userId]
      )

      res.json({
        message:
          "Password changed successfully",
      })
    } catch (error) {
      console.error(
        "Error changing password:",
        error
      )

      res.status(500).json({
        message: "Failed to change password",
      })
    }
  }
)

// ==================================================
// TASKS
// ==================================================

app.get("/api/tasks", async (req, res) => {
  const userId = (req as AuthRequest).userId

  try {
    const result = await pool.query(
      `SELECT * FROM tasks
       WHERE user_id = $1
       ORDER BY id ASC`,
      [userId]
    )

    res.json(result.rows)
  } catch (error) {
    console.error(
      "Error fetching tasks:",
      error
    )

    res.status(500).json({
      message: "Failed to fetch tasks",
    })
  }
})

app.post("/api/tasks", async (req, res) => {
  const userId = (req as AuthRequest).userId

  try {
    const { title } = req.body

    const result = await pool.query(
      `INSERT INTO tasks
       (title, completed, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, false, userId]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error(
      "Error adding task:",
      error
    )

    res.status(500).json({
      message: "Failed to add task",
    })
  }
})

app.put("/api/tasks/:id", async (req, res) => {
  const userId = (req as AuthRequest).userId

  try {
    const taskId = Number(req.params.id)

    const { title, completed } = req.body

    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           completed = COALESCE($2, completed)
       WHERE id = $3
         AND user_id = $4
       RETURNING *`,
      [
        title,
        completed,
        taskId,
        userId,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found",
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error(
      "Error updating task:",
      error
    )

    res.status(500).json({
      message: "Failed to update task",
    })
  }
})

app.delete(
  "/api/tasks/:id",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const taskId = Number(req.params.id)

      const result = await pool.query(
        `DELETE FROM tasks
         WHERE id = $1
           AND user_id = $2
         RETURNING *`,
        [taskId, userId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Task not found",
        })
      }

      res.json({
        message:
          "Task deleted successfully",
      })
    } catch (error) {
      console.error(
        "Error deleting task:",
        error
      )

      res.status(500).json({
        message: "Failed to delete task",
      })
    }
  }
)

// ==================================================
// HABITS
// ==================================================

app.get("/api/habits", async (req, res) => {
  const userId = (req as AuthRequest).userId

  try {
    const result = await pool.query(
      `SELECT * FROM habits
       WHERE user_id = $1
       ORDER BY id ASC`,
      [userId]
    )

    res.json(result.rows)
  } catch (error) {
    console.error(
      "Error fetching habits:",
      error
    )

    res.status(500).json({
      message: "Failed to fetch habits",
    })
  }
})

app.post("/api/habits", async (req, res) => {
  const userId = (req as AuthRequest).userId

  try {
    const { name } = req.body

    const result = await pool.query(
      `INSERT INTO habits
       (name, completed, streak, last_completed_date, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name,
        false,
        0,
        null,
        userId,
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error(
      "Error adding habit:",
      error
    )

    res.status(500).json({
      message: "Failed to add habit",
    })
  }
})

app.put(
  "/api/habits/:id",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const habitId =
        Number(req.params.id)

      const { completed } = req.body

      if (
        typeof completed !== "boolean"
      ) {
        return res.status(400).json({
          message:
            "Completed must be true or false.",
        })
      }

      const result = await pool.query(
        `
        UPDATE habits
        SET
          completed = $1,

          streak =
            CASE
              WHEN $1 = TRUE
                AND (
                  last_completed_date IS NULL
                  OR last_completed_date <>
                    (
                      CURRENT_TIMESTAMP
                      AT TIME ZONE 'Asia/Kolkata'
                    )::date
                )
              THEN streak + 1

              ELSE streak
            END,

          last_completed_date =
            CASE
              WHEN $1 = TRUE
                AND (
                  last_completed_date IS NULL
                  OR last_completed_date <>
                    (
                      CURRENT_TIMESTAMP
                      AT TIME ZONE 'Asia/Kolkata'
                    )::date
                )
              THEN
                (
                  CURRENT_TIMESTAMP
                  AT TIME ZONE 'Asia/Kolkata'
                )::date

              ELSE last_completed_date
            END

        WHERE id = $2
          AND user_id = $3

        RETURNING *
        `,
        [
          completed,
          habitId,
          userId,
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Habit not found.",
        })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error(
        "Error updating habit:",
        error
      )

      res.status(500).json({
        message:
          "Failed to update habit.",
      })
    }
  }
)
app.delete(
  "/api/habits/:id",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const habitId = Number(req.params.id)

      const result = await pool.query(
        `DELETE FROM habits
         WHERE id = $1
           AND user_id = $2
         RETURNING *`,
        [habitId, userId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Habit not found",
        })
      }

      res.json({
        message:
          "Habit deleted successfully",
      })
    } catch (error) {
      console.error(
        "Error deleting habit:",
        error
      )

      res.status(500).json({
        message: "Failed to delete habit",
      })
    }
  }
)

// ==================================================
// STUDY
// ==================================================

app.get("/api/study", async (req, res) => {
  const userId = (req as AuthRequest).userId

  try {
    const result = await pool.query(
      `SELECT * FROM study_sessions
       WHERE user_id = $1
       ORDER BY id ASC`,
      [userId]
    )

    res.json(result.rows)
  } catch (error) {
    console.error(
      "Error fetching study sessions:",
      error
    )

    res.status(500).json({
      message:
        "Failed to fetch study sessions",
    })
  }
})

app.post("/api/study", async (req, res) => {
  const userId = (req as AuthRequest).userId

  try {
    const { minutes, date } = req.body

    const result = await pool.query(
      `INSERT INTO study_sessions
       (minutes, date, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [minutes, date, userId]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error(
      "Error adding study session:",
      error
    )

    res.status(500).json({
      message:
        "Failed to add study session",
    })
  }
})

app.put(
  "/api/study/:id",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const studyId = Number(req.params.id)

      const { minutes, date } = req.body

      const result = await pool.query(
        `UPDATE study_sessions
         SET minutes = COALESCE($1, minutes),
             date = COALESCE($2, date)
         WHERE id = $3
           AND user_id = $4
         RETURNING *`,
        [
          minutes,
          date,
          studyId,
          userId,
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Study session not found",
        })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error(
        "Error updating study session:",
        error
      )

      res.status(500).json({
        message:
          "Failed to update study session",
      })
    }
  }
)

app.delete(
  "/api/study/:id",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const studyId = Number(req.params.id)

      const result = await pool.query(
        `DELETE FROM study_sessions
         WHERE id = $1
           AND user_id = $2
         RETURNING *`,
        [studyId, userId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Study session not found",
        })
      }

      res.json({
        message:
          "Study session deleted successfully",
      })
    } catch (error) {
      console.error(
        "Error deleting study session:",
        error
      )

      res.status(500).json({
        message:
          "Failed to delete study session",
      })
    }
  }
)

// ==================================================
// EXPENSES
// ==================================================

app.get("/api/expenses", async (req, res) => {
  const userId = (req as AuthRequest).userId

  try {
    const result = await pool.query(
      `SELECT * FROM expenses
       WHERE user_id = $1
       ORDER BY id ASC`,
      [userId]
    )

    res.json(result.rows)
  } catch (error) {
    console.error(
      "Error fetching expenses:",
      error
    )

    res.status(500).json({
      message: "Failed to fetch expenses",
    })
  }
})

app.post(
  "/api/expenses",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const {
        title,
        amount,
        date,
      } = req.body

      const result = await pool.query(
        `INSERT INTO expenses
         (title, amount, date, user_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          title,
          amount,
          date,
          userId,
        ]
      )

      res.status(201).json(
        result.rows[0]
      )
    } catch (error) {
      console.error(
        "Error adding expense:",
        error
      )

      res.status(500).json({
        message:
          "Failed to add expense",
      })
    }
  }
)

app.put(
  "/api/expenses/:id",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const expenseId =
        Number(req.params.id)

      const {
        title,
        amount,
        date,
      } = req.body

      const result = await pool.query(
        `UPDATE expenses
         SET title = COALESCE($1, title),
             amount = COALESCE($2, amount),
             date = COALESCE($3, date)
         WHERE id = $4
           AND user_id = $5
         RETURNING *`,
        [
          title,
          amount,
          date,
          expenseId,
          userId,
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Expense not found",
        })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error(
        "Error updating expense:",
        error
      )

      res.status(500).json({
        message:
          "Failed to update expense",
      })
    }
  }
)

app.delete(
  "/api/expenses/:id",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const expenseId =
        Number(req.params.id)

      const result = await pool.query(
        `DELETE FROM expenses
         WHERE id = $1
           AND user_id = $2
         RETURNING *`,
        [
          expenseId,
          userId,
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Expense not found",
        })
      }

      res.json({
        message:
          "Expense deleted successfully",
      })
    } catch (error) {
      console.error(
        "Error deleting expense:",
        error
      )

      res.status(500).json({
        message:
          "Failed to delete expense",
      })
    }
  }
)

// ==================================================
// GOALS
// ==================================================

app.get("/api/goals", async (req, res) => {
  const userId = (req as AuthRequest).userId

  try {
    const result = await pool.query(
      `SELECT * FROM goals
       WHERE user_id = $1
       ORDER BY id ASC`,
      [userId]
    )

    res.json(result.rows)
  } catch (error) {
    console.error(
      "Error fetching goals:",
      error
    )

    res.status(500).json({
      message: "Failed to fetch goals",
    })
  }
})

app.post("/api/goals", async (req, res) => {
  const userId = (req as AuthRequest).userId

  try {
    const {
      title,
      progress,
    } = req.body

    const result = await pool.query(
      `INSERT INTO goals
       (title, progress, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        title,
        progress ?? 0,
        userId,
      ]
    )

    res.status(201).json(
      result.rows[0]
    )
  } catch (error) {
    console.error(
      "Error adding goal:",
      error
    )

    res.status(500).json({
      message: "Failed to add goal",
    })
  }
})

app.put(
  "/api/goals/:id",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const goalId =
        Number(req.params.id)

      const {
        title,
        progress,
      } = req.body

      const result = await pool.query(
        `UPDATE goals
         SET title = COALESCE($1, title),
             progress = COALESCE($2, progress)
         WHERE id = $3
           AND user_id = $4
         RETURNING *`,
        [
          title,
          progress,
          goalId,
          userId,
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Goal not found",
        })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error(
        "Error updating goal:",
        error
      )

      res.status(500).json({
        message:
          "Failed to update goal",
      })
    }
  }
)

app.delete(
  "/api/goals/:id",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const goalId =
        Number(req.params.id)

      const result = await pool.query(
        `DELETE FROM goals
         WHERE id = $1
           AND user_id = $2
         RETURNING *`,
        [
          goalId,
          userId,
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Goal not found",
        })
      }

      res.json({
        message:
          "Goal deleted successfully",
      })
    } catch (error) {
      console.error(
        "Error deleting goal:",
        error
      )

      res.status(500).json({
        message:
          "Failed to delete goal",
      })
    }
  }
)

// ==================================================
// JOURNAL
// ==================================================

app.get(
  "/api/journal",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const result = await pool.query(
        `SELECT * FROM journal_entries
         WHERE user_id = $1
         ORDER BY id DESC`,
        [userId]
      )

      res.json(result.rows)
    } catch (error) {
      console.error(
        "Error fetching journal entries:",
        error
      )

      res.status(500).json({
        message:
          "Failed to fetch journal entries",
      })
    }
  }
)

app.post(
  "/api/journal",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const {
        title,
        content,
        date,
      } = req.body

      const result = await pool.query(
        `INSERT INTO journal_entries
         (title, content, date, user_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          title,
          content,
          date,
          userId,
        ]
      )

      res.status(201).json(
        result.rows[0]
      )
    } catch (error) {
      console.error(
        "Error adding journal entry:",
        error
      )

      res.status(500).json({
        message:
          "Failed to add journal entry",
      })
    }
  }
)

app.put(
  "/api/journal/:id",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const journalId =
        Number(req.params.id)

      const {
        title,
        content,
        date,
      } = req.body

      const result = await pool.query(
        `UPDATE journal_entries
         SET title = COALESCE($1, title),
             content = COALESCE($2, content),
             date = COALESCE($3, date)
         WHERE id = $4
           AND user_id = $5
         RETURNING *`,
        [
          title,
          content,
          date,
          journalId,
          userId,
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Journal entry not found",
        })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error(
        "Error updating journal entry:",
        error
      )

      res.status(500).json({
        message:
          "Failed to update journal entry",
      })
    }
  }
)

app.delete(
  "/api/journal/:id",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      const journalId =
        Number(req.params.id)

      const result = await pool.query(
        `DELETE FROM journal_entries
         WHERE id = $1
           AND user_id = $2
         RETURNING *`,
        [
          journalId,
          userId,
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Journal entry not found",
        })
      }

      res.json({
        message:
          "Journal entry deleted successfully",
      })
    } catch (error) {
      console.error(
        "Error deleting journal entry:",
        error
      )

      res.status(500).json({
        message:
          "Failed to delete journal entry",
      })
    }
  }
)

// ==================================================
// CLEAR ALL DATA FOR CURRENT USER
// ==================================================

app.delete(
  "/api/data",
  async (req, res) => {
    const userId =
      (req as AuthRequest).userId

    try {
      await pool.query("BEGIN")

      await pool.query(
        "DELETE FROM tasks WHERE user_id = $1",
        [userId]
      )

      await pool.query(
        "DELETE FROM habits WHERE user_id = $1",
        [userId]
      )

      await pool.query(
        "DELETE FROM study_sessions WHERE user_id = $1",
        [userId]
      )

      await pool.query(
        "DELETE FROM expenses WHERE user_id = $1",
        [userId]
      )

      await pool.query(
        "DELETE FROM goals WHERE user_id = $1",
        [userId]
      )

      await pool.query(
        "DELETE FROM journal_entries WHERE user_id = $1",
        [userId]
      )

      await pool.query("COMMIT")

      res.json({
        message:
          "All TinyLife data deleted successfully",
      })
    } catch (error) {
      await pool.query("ROLLBACK")

      console.error(
        "Error clearing all data:",
        error
      )

      res.status(500).json({
        message:
          "Failed to clear all data",
      })
    }
  }
)

// ==================================================
// DATABASE CONNECTION
// ==================================================

pool
  .query("SELECT NOW()")
  .then((result) => {
    console.log(
      "PostgreSQL connected successfully"
    )

    console.log(
      "Database time:",
      result.rows[0].now
    )

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `TinyLife server running on http://localhost:${PORT}`
      )
    })
  })
  .catch((error) => {
    console.error(
      "PostgreSQL connection failed:",
      error.message
    )
  })