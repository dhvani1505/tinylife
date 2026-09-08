import { useState } from "react"
import {
  Link,
  useNavigate,
} from "react-router-dom"
import axios from "axios"

function VerifyOTP() {
  const navigate = useNavigate()

  const email = new URLSearchParams(
    window.location.search
  ).get("email")

  const [otp, setOtp] =
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
        "Invalid or missing email."
      )
      return
    }

    if (!otp) {
      setMessage(
        "Please enter the OTP."
      )
      return
    }

    if (!/^\d{6}$/.test(otp)) {
      setMessage(
        "OTP must be 6 digits."
      )
      return
    }

    try {
      setLoading(true)

      await axios.post(
        "http://localhost:5000/api/verify-reset-otp",
        {
          email,
          otp,
        }
      )

      navigate(
        `/reset-password?email=${encodeURIComponent(
          email
        )}&otp=${otp}`
      )
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Invalid or expired OTP."
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
          Verify your OTP
        </p>

        <p>
          Enter the 6-digit OTP sent
          to your email address.
        </p>

        <form
          onSubmit={handleSubmit}
        >

          <label>
            OTP
          </label>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(event) =>
              setOtp(
                event.target.value.replace(
                  /\D/g,
                  ""
                )
              )
            }
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Verifying..."
              : "Verify OTP"}
          </button>

        </form>

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        <p className="login-footer">
          <Link to="/forgot-password">
            Back to Forgot Password
          </Link>
        </p>

      </div>

    </div>
  )
}

export default VerifyOTP