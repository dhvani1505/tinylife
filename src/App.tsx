import "./App.css"
import axios from "axios"
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"

import Navbar from "./components/Navbar"
import Sidebar from "./components/Sidebar"

import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"

import Overview from "./pages/Overview"
import Tasks from "./pages/Tasks"
import Habits from "./pages/Habits"
import Study from "./pages/Study"
import Expenses from "./pages/Expenses"
import Journal from "./pages/Journal"
import Goals from "./pages/Goals"
import Settings from "./pages/Settings"
import VerifyOTP from "./pages/VerifyOTP"

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem(
    "tinylife-token"
  )

  if (
    config.url &&
    config.url.startsWith(
      "http://localhost:5000"
    )
  ) {
    config.url =
      `${import.meta.env.VITE_API_URL}${config.url.replace(
        "http://localhost:5000",
        ""
      )}`
  }

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`
  }

  return config
})

axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const status =
      error.response?.status

    const token =
      localStorage.getItem(
        "tinylife-token"
      )

    if (
      token &&
      (status === 401 ||
        status === 403)
    ) {
      localStorage.removeItem(
        "tinylife-user"
      )

      localStorage.removeItem(
        "tinylife-token"
      )

      window.location.href =
        "/login"
    }

    return Promise.reject(error)
  }
)

function ProtectedRoute() {
  const user =
    localStorage.getItem(
      "tinylife-user"
    )

  const token =
    localStorage.getItem(
      "tinylife-token"
    )

  if (!user || !token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  return <DashboardLayout />
}

function DashboardLayout() {
  return (
    <div className="app">

      <Sidebar />

      <div className="page">

        <Navbar />

        <main className="main-content">

          <Routes>

            <Route
              path="/"
              element={<Overview />}
            />

            <Route
              path="/tasks"
              element={<Tasks />}
            />

            <Route
              path="/habits"
              element={<Habits />}
            />

            <Route
              path="/study"
              element={<Study />}
            />

            <Route
              path="/expenses"
              element={<Expenses />}
            />

            <Route
              path="/journal"
              element={<Journal />}
            />

            <Route
              path="/goals"
              element={<Goals />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />

          </Routes>

        </main>

      </div>

    </div>
  )
}

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
<Route
  path="/verify-otp"
  element={<VerifyOTP />}
/>
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/*"
          element={<ProtectedRoute />}
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App