-- ============================================
-- Secure Exam Web — Database Schema
-- Run: psql "$DATABASE_URL" -f schema.sql
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    special_id    VARCHAR(100),           -- Student ID / Employee ID / Admin Code
    batch         VARCHAR(20),
    department    VARCHAR(100),
    status        VARCHAR(20)  NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Examining', 'Blocked')),
    photo_url     VARCHAR(500),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. EXAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exams (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title            VARCHAR(255) NOT NULL,
    subject          VARCHAR(255) NOT NULL,
    scheduled_at     TIMESTAMP,
    duration_minutes INT          NOT NULL DEFAULT 60,
    status           VARCHAR(20)  NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Scheduled', 'Live', 'Completed')),
    security_level   VARCHAR(10)  NOT NULL DEFAULT 'High' CHECK (security_level IN ('Low', 'Medium', 'High')),
    created_by       UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. EXAM CANDIDATES (Student ↔ Exam link)
-- ============================================
CREATE TABLE IF NOT EXISTS exam_candidates (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id    UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     VARCHAR(20) NOT NULL DEFAULT 'Registered' CHECK (status IN ('Registered', 'In-Progress', 'Completed')),
    score      INT,
    grade      VARCHAR(10),
    UNIQUE(exam_id, student_id)
);

-- ============================================
-- 4. GROUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS groups (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(255) NOT NULL,
    batch_year VARCHAR(20),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. GROUP MEMBERS (User ↔ Group link)
-- ============================================
CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);

-- ============================================
-- 6. SUPPORT TICKETS
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject    VARCHAR(255) NOT NULL,
    message    TEXT NOT NULL,
    status     VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. EXAM QUESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS exam_questions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id       UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL DEFAULT 'MCQ' CHECK (question_type IN ('MCQ', 'short_answer', 'essay')),
    points        INT NOT NULL DEFAULT 1,
    sort_order    INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. QUESTION OPTIONS (for MCQ)
-- ============================================
CREATE TABLE IF NOT EXISTS question_options (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================
-- 9. STUDENT ANSWERS
-- ============================================
CREATE TABLE IF NOT EXISTS student_answers (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id            UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id        UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
    text_answer        TEXT,
    is_correct         BOOLEAN,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(exam_id, student_id, question_id)
);

-- ============================================
-- 10. PROCTORING EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS proctoring_events (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id    UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('tab_switch', 'focus_loss', 'face_warning', 'copy_attempt', 'right_click', 'devtools')),
    details    TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- 11. TICKET REPLIES
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_replies (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id  UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message    TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- 12. EXAM ↔ GROUP ASSIGNMENT
-- ============================================
CREATE TABLE IF NOT EXISTS exam_groups (
    exam_id  UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, group_id)
);

-- ============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE exams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE exams ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;

-- ============================================
-- 13. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message    TEXT NOT NULL,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- Add created_at to exam_candidates if missing (needed for Latest Result sorting)
ALTER TABLE exam_candidates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exam_candidates_exam ON exam_candidates(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_candidates_student ON exam_candidates(student_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_exam ON student_answers(exam_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_student ON student_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_exam ON proctoring_events(exam_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_student ON proctoring_events(student_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON ticket_replies(ticket_id);
