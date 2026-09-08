-- ============================================
-- TinyLife Database Schema
-- PostgreSQL
-- ============================================

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- TASKS
-- ============================================

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    user_id INTEGER REFERENCES users(id)
);


-- ============================================
-- HABITS
-- ============================================

CREATE TABLE habits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    user_id INTEGER REFERENCES users(id)
);


-- ============================================
-- STUDY SESSIONS
-- ============================================

CREATE TABLE study_sessions (
    id SERIAL PRIMARY KEY,
    minutes INTEGER NOT NULL,
    date DATE NOT NULL,
    user_id INTEGER REFERENCES users(id)
);


-- ============================================
-- EXPENSES
-- ============================================

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    user_id INTEGER REFERENCES users(id)
);


-- ============================================
-- GOALS
-- ============================================

CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    progress INTEGER DEFAULT 0,
    user_id INTEGER REFERENCES users(id)
);


-- ============================================
-- JOURNAL ENTRIES
-- ============================================

CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL,
    user_id INTEGER REFERENCES users(id)
);