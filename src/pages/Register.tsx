import { useState } from "react"
import axios from "axios"
import { Link } from "react-router-dom"

function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleRegister = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    if (!name || !email || !password) {
      setMessage("Please fill in all fields.")
      return
    }

    try {
      await axios.post(
        "http://localhost:5000/api/register",
        {
          name,
          email,
          password,
        }
      )

      setMessage("Account created successfully.")

      setName("")
      setEmail("")
      setPassword("")
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Registration failed."
      )
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>TinyLife</h1>

        <p className="login-subtitle">
          Create your TinyLife account.
        </p>

        <form onSubmit={handleRegister}>
          <label>Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
          />

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
          />

          <button type="submit">
            Create Account
          </button>
        </form>

        {message && (
          <p className="login-footer">
            {message}
          </p>
        )}

        <p className="login-footer">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default Register