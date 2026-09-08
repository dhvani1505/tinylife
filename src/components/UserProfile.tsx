import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  NavLink,
  useNavigate,
} from "react-router-dom"

type User = {
  id: number
  name: string
  email: string
}

function UserProfile() {
  const navigate = useNavigate()

  const [user, setUser] =
    useState<User | null>(null)

  const [showMenu, setShowMenu] =
    useState(false)

  const profileRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadUser = () => {
      const savedUser =
        localStorage.getItem(
          "tinylife-user"
        )

      if (savedUser) {
        try {
          setUser(
            JSON.parse(savedUser)
          )
        } catch (error) {
          console.error(
            "Error reading user:",
            error
          )
        }
      }
    }

    loadUser()

    window.addEventListener(
      "tinylife-user-updated",
      loadUser
    )

    return () => {
      window.removeEventListener(
        "tinylife-user-updated",
        loadUser
      )
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target as Node
        )
      ) {
        setShowMenu(false)
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      )
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem(
      "tinylife-user"
    )

    localStorage.removeItem(
      "tinylife-token"
    )

    navigate("/login")
  }

  if (!user) {
    return null
  }

  const initial = user.name
    .charAt(0)
    .toUpperCase()

  return (
    <div
      className="user-profile"
      ref={profileRef}
    >

      <button
        type="button"
        className="avatar"
        onClick={() =>
          setShowMenu(
            (current) => !current
          )
        }
        aria-label="Open profile menu"
      >
        {initial}
      </button>

      <div className="user-info">

        <p className="user-name">
          {user.name}
        </p>

        <p className="user-role">
          TinyLife member
        </p>

      </div>

      {showMenu && (
        <div className="profile-menu">

          <NavLink
            to="/settings"
            onClick={() =>
              setShowMenu(false)
            }
          >
            Settings
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>
      )}

    </div>
  )
}

export default UserProfile