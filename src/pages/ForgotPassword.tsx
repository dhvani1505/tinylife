import { useState } from "react"
import {
  Link,
} from "react-router-dom"
import axios from "axios"

function ForgotPassword() {
  const [email, setEmail] =
    useState("")

  const [message, setMessage] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    setMessage("")

    if (!email) {
      setMessage(
        "Please enter your email address."
      )
      return
    }

    try {
      setLoading(true)

      const response =
        await axios.post(
          "http://localhost:5000/api/forgot-password",
          {
            email,
          }
        )

      setMessage(
        response.data.message ||
          "If an account exists with this email, a password reset link has been sent."
      )
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">

      <div className="login-card">

        <h1>TinyLife</h1>

        <p className="login-subtitle">
          Reset your password
        </p>

        <p>
          Enter your email address and
          we'll send you a password reset
          link.
        </p>

        <form
          onSubmit={handleSubmit}
        >

          <label>
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Send Reset Link"}
          </button>

        </form>

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        <p className="login-footer">
          Remember your password?{" "}
          <Link to="/login">
            Back to Login
          </Link>
        </p>

      </div>

    </div>
  )
}

export default ForgotPassword