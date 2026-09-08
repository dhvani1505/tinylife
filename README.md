# TinyLife

TinyLife is a personal life management dashboard built with React, TypeScript, Node.js, Express, and PostgreSQL.

It helps users manage everyday tasks, habits, study sessions, expenses, goals, and journal entries from one simple dashboard.

## Features

- User registration and login
- JWT-based authentication
- Personal user profiles
- Task management
  - Add tasks
  - Edit tasks
  - Complete tasks
  - Delete tasks
- Habit tracking
  - Add habits
  - Complete daily habits
  - Automatic streak tracking
- Study session tracking
  - Add study sessions
  - Edit sessions
  - Delete sessions
  - Study timer
- Expense tracking
  - Add expenses
  - Edit expenses
  - Delete expenses
  - Monthly expense history
- Goal tracking
  - Add goals
  - Update progress
  - Delete goals
- Personal journal
  - Add entries
  - Edit entries
  - Delete entries
- Dashboard overview
  - Task progress
  - Habit progress
  - Study time
  - Total expenses
  - Goal progress
- Notifications for incomplete tasks and habits
- Profile menu with Settings and Logout
- Change account name
- Change password
- Clear personal TinyLife data
- Responsive design for desktop and mobile

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- CSS

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- JWT
- bcrypt
- CORS

### Database

- PostgreSQL

## Project Structure

```text
TinyLife
├── src
│   ├── components
│   ├── pages
│   ├── App.tsx
│   ├── App.css
│   └── index.css
│
├── server
│   ├── server.ts
│   ├── db.ts
│   └── authMiddleware.ts
│
├── package.json
└── README.md