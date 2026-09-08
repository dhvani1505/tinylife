import { useState } from "react"
import {
  Link,
  useNavigate,
} from "react-router-dom"
import axios from "axios"

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [message, setMessage] =
    useState("")

  const handleLogin = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    if (!email || !password) {
      setMessage(
        "Please enter your email and password."
      )
      return
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/login",
        {
          email,
          password,
        }
      )

      const user =
        response.data.user

      const token =
        response.data.token

      localStorage.setItem(
        "tinylife-user",
        JSON.stringify(user)
      )

      localStorage.setItem(
        "tinylife-token",
        token
      )

      navigate("/")
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Login failed."
      )
    }
  }

  return (
    <div className="login-page">

      <div className="login-card">

        <h1>TinyLife</h1>

        <p className="login-subtitle">
          Welcome back. Let's get things done.
        </p>

        <form onSubmit={handleLogin}>

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

          <label>
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
          />

          <div className="forgot-password">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button type="submit">
            Login
          </button>

        </form>

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        <p className="login-footer">
          Don't have an account?{" "}
          <Link to="/register">
            Sign up
          </Link>
        </p>

      </div>

    </div>
  )
}

export default Login