import axios from "axios"
import { useEffect, useState } from "react"

type User = {
  id: number
  name: string
  email: string
}

function Settings() {
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")

  useEffect(() => {
    const savedUser = localStorage.getItem(
      "tinylife-user"
    )

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)

        setUser(parsedUser)
        setName(parsedUser.name)
      } catch (error) {
        console.error(
          "Error reading user:",
          error
        )
      }
    }
  }, [])

  const updateName = async () => {
    if (!name.trim()) {
      setMessage("Name cannot be empty.")
      return
    }

    try {
      const response = await axios.put(
        "http://localhost:5000/api/profile",
        {
          name: name.trim(),
        }
      )

      const updatedUser = response.data.user

      setUser(updatedUser)

      localStorage.setItem(
        "tinylife-user",
        JSON.stringify(updatedUser)
      )

      window.dispatchEvent(
        new Event("tinylife-user-updated")
      )

      setMessage("Name updated successfully.")
    } catch (error: any) {
      console.error(
        "Error updating name:",
        error
      )

      setMessage(
        error.response?.data?.message ||
          "Failed to update name."
      )
    }
  }

  const changePassword = async () => {
    setPasswordMessage("")

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordMessage(
        "Please fill in all password fields."
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        "New passwords do not match."
      )
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage(
        "New password must be at least 6 characters."
      )
      return
    }

    try {
      await axios.put(
        "http://localhost:5000/api/profile/password",
        {
          currentPassword,
          newPassword,
          confirmPassword,
        }
      )

      setPasswordMessage(
        "Password changed successfully."
      )

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error(
        "Error changing password:",
        error
      )

      setPasswordMessage(
        error.response?.data?.message ||
          "Failed to change password."
      )
    }
  }

  const clearAllData = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete ALL TinyLife data? This cannot be undone."
    )

    if (!confirmed) {
      return
    }

    try {
      await axios.delete(
        "http://localhost:5000/api/data"
      )

      alert("All TinyLife data has been deleted.")

      window.location.reload()
    } catch (error) {
      console.error(
        "Error clearing all data:",
        error
      )

      alert(
        "Failed to clear data. Please try again."
      )
    }
  }

  return (
    <div className="settings-page">

      <h1>Settings</h1>

      <p>
        Customize your TinyLife experience.
      </p>

      {/* --------------------
          ACCOUNT
      -------------------- */}

      <div className="settings-card">

        <h2>Account</h2>

        {user && (
          <div className="account-info">

            <div className="account-field">

              <span className="account-label">
                Name
              </span>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter your name"
              />

            </div>

            <div className="account-field">

              <span className="account-label">
                Email
              </span>

              <span className="account-value">
                {user.email}
              </span>

            </div>

            <button
              className="save-name-button"
              onClick={updateName}
            >
              Save Name
            </button>

            {message && (
              <p className="settings-message">
                {message}
              </p>
            )}

          </div>
        )}

      </div>

      {/* --------------------
          CHANGE PASSWORD
      -------------------- */}

      <div className="settings-card">

        <h2>Change Password</h2>

        <div className="password-form">

          <div className="account-field">

            <span className="account-label">
              Current Password
            </span>

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value
                )
              }
              placeholder="Enter current password"
            />

          </div>

          <div className="account-field">

            <span className="account-label">
              New Password
            </span>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value
                )
              }
              placeholder="Enter new password"
            />

          </div>

          <div className="account-field">

            <span className="account-label">
              Confirm New Password
            </span>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Confirm new password"
            />

          </div>

          <button
            className="save-name-button"
            onClick={changePassword}
          >
            Change Password
          </button>

          {passwordMessage && (
            <p className="settings-message">
              {passwordMessage}
            </p>
          )}

        </div>

      </div>

      {/* --------------------
          TINYLIFE SETTINGS
      -------------------- */}

      <div className="settings-card">

        <h2>TinyLife Settings</h2>

        <p>
          More settings are coming soon.
        </p>

      </div>

      {/* --------------------
          CLEAR DATA
      -------------------- */}

      <div className="settings-card danger-card">

        <h2>
          Clear All Data
        </h2>

        <p>
          Delete all your TinyLife tasks, habits,
          expenses, study sessions, goals, and
          journal data.
        </p>

        <button
          className="clear-data-button"
          onClick={clearAllData}
        >
          Clear All Data
        </button>

      </div>

    </div>
  )
}

export default Settings