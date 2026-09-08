import { useState } from "react"
import {
  Link,
  useNavigate,
} from "react-router-dom"
import axios from "axios"

function ResetPassword() {
  const navigate = useNavigate()

  const params =
    new URLSearchParams(
      window.location.search
    )

  const email = params.get("email")
  const otp = params.get("otp")

  const [password, setPassword] =
    useState("")

  const [confirmPassword, setConfirmPassword] =
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

    if (!email || !otp) {
      setMessage(
        "Invalid or missing OTP."
      )
      return
    }

    if (!password || !confirmPassword) {
      setMessage(
        "Please enter your new password."
      )
      return
    }

    if (password.length < 6) {
      setMessage(
        "Password must be at least 6 characters."
      )
      return
    }

    if (
      password !== confirmPassword
    ) {
      setMessage(
        "Passwords do not match."
      )
      return
    }

    try {
      setLoading(true)

      const response =
        await axios.post(
          "http://localhost:5000/api/reset-password",
          {
            email,
            otp,
            newPassword: password,
            confirmPassword,
          }
        )

      setMessage(
        response.data.message ||
          "Password reset successfully."
      )

      setTimeout(() => {
        navigate("/login")
      }, 1500)
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Password reset failed. Please try again."
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
          Create a new password
        </p>

        <p>
          Enter your new password below.
        </p>

        <form
          onSubmit={handleSubmit}
        >

          <label>
            New Password
          </label>

          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
          />

          <label>
            Confirm Password
          </label>

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Resetting..."
              : "Reset Password"}
          </button>

        </form>

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        <p className="login-footer">
          <Link to="/login">
            Back to Login
          </Link>
        </p>

      </div>

    </div>
  )
}

export default ResetPassword