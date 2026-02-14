-- ============================================
-- Secure Exam Web — Seed Data
-- Run: psql "$DATABASE_URL" -f seed.sql
-- ============================================

-- NOTE: Passwords are all 'password123' hashed with bcrypt
-- $2a$10$... is the bcrypt hash for 'password123'

-- ============================================
-- ADMIN USERS
-- ============================================
INSERT INTO users (name, email, password_hash, role, special_id, batch, department, status, photo_url) VALUES
('Dr. Robert', 'robert@college.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'admin', 'ADM-101', 'Staff', 'Dean', 'Active', 'https://ui-avatars.com/api/?name=Robert&background=1e293b&color=fff'),
('Prof. Lisa', 'lisa@college.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'admin', 'ADM-102', 'Faculty', 'Exam Cell', 'Active', 'https://ui-avatars.com/api/?name=Lisa&background=334155&color=fff')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- TEACHER USERS
-- ============================================
INSERT INTO users (name, email, password_hash, role, special_id, batch, department, status, photo_url) VALUES
('Prof. Sharma', 'sharma@college.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'teacher', 'TCH-201', 'Faculty', 'Computer Science', 'Active', 'https://ui-avatars.com/api/?name=Prof+Sharma&background=4338ca&color=fff'),
('Dr. Mehta', 'mehta@college.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'teacher', 'TCH-202', 'Faculty', 'Mathematics', 'Active', 'https://ui-avatars.com/api/?name=Dr+Mehta&background=4338ca&color=fff')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- STUDENT USERS
-- ============================================
INSERT INTO users (name, email, password_hash, role, special_id, batch, department, status, photo_url) VALUES
('Aarav Sharma', 'aarav@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024001', '2024-25', 'CS', 'Active', 'https://ui-avatars.com/api/?name=Aarav+Sharma&background=e0e7ff&color=4338ca'),
('Ananya Iyer', 'ananya@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024002', '2024-25', 'IT', 'Examining', 'https://ui-avatars.com/api/?name=Ananya+Iyer&background=fce7f3&color=db2777'),
('Rohan Verma', 'rohan.verma@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024003', '2024-25', 'Mech', 'Active', 'https://ui-avatars.com/api/?name=Rohan+Verma&background=dcfce7&color=15803d'),
('Priya Nair', 'priya.nair@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024004', '2024-25', 'Civil', 'Blocked', 'https://ui-avatars.com/api/?name=Priya+Nair&background=fee2e2&color=dc2626'),
('Karan Malhotra', 'karan@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024005', '2024-25', 'ECE', 'Active', 'https://ui-avatars.com/api/?name=Karan+Malhotra&background=e0e7ff&color=4338ca'),
('Sneha Reddy', 'sneha@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024006', '2024-25', 'CS', 'Examining', 'https://ui-avatars.com/api/?name=Sneha+Reddy&background=fce7f3&color=db2777'),
('Vikram Singh', 'vikram@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024007', '2024-25', 'IT', 'Active', 'https://ui-avatars.com/api/?name=Vikram+Singh&background=dcfce7&color=15803d'),
('Neha Gupta', 'neha@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024008', '2024-25', 'Civil', 'Active', 'https://ui-avatars.com/api/?name=Neha+Gupta&background=e0e7ff&color=4338ca'),
('Rahul Mehta', 'rahul@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024009', '2024-25', 'Mech', 'Blocked', 'https://ui-avatars.com/api/?name=Rahul+Mehta&background=fee2e2&color=dc2626'),
('Pooja Kulkarni', 'pooja@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024010', '2024-25', 'ECE', 'Active', 'https://ui-avatars.com/api/?name=Pooja+Kulkarni&background=fce7f3&color=db2777'),
('Aditya Joshi', 'aditya@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024011', '2023-24', 'CS', 'Active', 'https://ui-avatars.com/api/?name=Aditya+Joshi&background=e0e7ff&color=4338ca'),
('Kavya Menon', 'kavya@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024012', '2023-24', 'IT', 'Examining', 'https://ui-avatars.com/api/?name=Kavya+Menon&background=fce7f3&color=db2777'),
('Suresh Yadav', 'suresh@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024013', '2023-24', 'Mech', 'Active', 'https://ui-avatars.com/api/?name=Suresh+Yadav&background=dcfce7&color=15803d'),
('Aishwarya Rao', 'aishwarya@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024014', '2023-24', 'Civil', 'Blocked', 'https://ui-avatars.com/api/?name=Aishwarya+Rao&background=fee2e2&color=dc2626'),
('Manish Pandey', 'manish@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024015', '2023-24', 'ECE', 'Active', 'https://ui-avatars.com/api/?name=Manish+Pandey&background=e0e7ff&color=4338ca'),
('Ritu Saxena', 'ritu@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024016', '2023-24', 'CS', 'Active', 'https://ui-avatars.com/api/?name=Ritu+Saxena&background=fce7f3&color=db2777'),
('Amit Choudhary', 'amit@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024017', '2023-24', 'IT', 'Examining', 'https://ui-avatars.com/api/?name=Amit+Choudhary&background=e0e7ff&color=4338ca'),
('Nidhi Bansal', 'nidhi@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024018', '2023-24', 'Civil', 'Active', 'https://ui-avatars.com/api/?name=Nidhi+Bansal&background=dcfce7&color=15803d'),
('Deepak Mishra', 'deepak@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024019', '2023-24', 'Mech', 'Blocked', 'https://ui-avatars.com/api/?name=Deepak+Mishra&background=fee2e2&color=dc2626'),
('Shreya Banerjee', 'shreya@exam.com', '$2a$10$vu2rUJYQOh3SXgF/axSWieG4XADDIlnDoGu.vvIRw5Ep5zNfFhOA2', 'student', '2024020', '2023-24', 'ECE', 'Active', 'https://ui-avatars.com/api/?name=Shreya+Banerjee&background=fce7f3&color=db2777')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- SAMPLE EXAMS
-- ============================================
INSERT INTO exams (title, subject, scheduled_at, duration_minutes, status, security_level) VALUES
('CS101: Data Structures', 'Computer Science', NOW() + INTERVAL '1 hour', 60, 'Live', 'High'),
('MATH202: Linear Algebra', 'Mathematics', NOW() + INTERVAL '1 day', 90, 'Scheduled', 'Medium'),
('PHY300: Quantum Mechanics', 'Physics', NOW() + INTERVAL '14 days', 120, 'Draft', 'High'),
('Java Test', 'Computer Science', NOW() + INTERVAL '2 days', 60, 'Scheduled', 'High'),
('Aptitude Test', 'General', NOW() - INTERVAL '30 days', 60, 'Completed', 'Medium'),
('English Lang', 'English', NOW() - INTERVAL '35 days', 45, 'Completed', 'Low')
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE GROUPS
-- ============================================
INSERT INTO groups (name, batch_year) VALUES
('Batch 1 — CS 2024-25', '2024-25'),
('Batch 2 — IT 2024-25', '2024-25'),
('Batch 3 — Mech 2024-25', '2024-25'),
('Batch 4 — Civil 2023-24', '2023-24'),
('Batch 5 — ECE 2023-24', '2023-24')
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE QUESTIONS FOR CS101: Data Structures
-- We use a CTE to look up the exam ID by title
-- ============================================
DO $$
DECLARE
    v_exam_id UUID;
    v_q1 UUID;
    v_q2 UUID;
    v_q3 UUID;
    v_q4 UUID;
    v_q5 UUID;
BEGIN
    -- Get the CS101 exam
    SELECT id INTO v_exam_id FROM exams WHERE title = 'CS101: Data Structures' LIMIT 1;
    IF v_exam_id IS NULL THEN RETURN; END IF;

    -- Skip if questions already exist
    IF EXISTS (SELECT 1 FROM exam_questions WHERE exam_id = v_exam_id) THEN RETURN; END IF;

    -- Q1: Stack
    INSERT INTO exam_questions (exam_id, question_text, question_type, points, sort_order)
    VALUES (v_exam_id, 'Which data structure uses LIFO (Last In, First Out) principle?', 'MCQ', 2, 1)
    RETURNING id INTO v_q1;

    INSERT INTO question_options (question_id, option_text, is_correct) VALUES
    (v_q1, 'Queue', FALSE),
    (v_q1, 'Stack', TRUE),
    (v_q1, 'Linked List', FALSE),
    (v_q1, 'Tree', FALSE);

    -- Q2: Time complexity
    INSERT INTO exam_questions (exam_id, question_text, question_type, points, sort_order)
    VALUES (v_exam_id, 'What is the average time complexity of binary search?', 'MCQ', 2, 2)
    RETURNING id INTO v_q2;

    INSERT INTO question_options (question_id, option_text, is_correct) VALUES
    (v_q2, 'O(n)', FALSE),
    (v_q2, 'O(log n)', TRUE),
    (v_q2, 'O(n²)', FALSE),
    (v_q2, 'O(1)', FALSE);

    -- Q3: Linked List
    INSERT INTO exam_questions (exam_id, question_text, question_type, points, sort_order)
    VALUES (v_exam_id, 'In a singly linked list, what does the last node point to?', 'MCQ', 2, 3)
    RETURNING id INTO v_q3;

    INSERT INTO question_options (question_id, option_text, is_correct) VALUES
    (v_q3, 'The first node', FALSE),
    (v_q3, 'The previous node', FALSE),
    (v_q3, 'NULL', TRUE),
    (v_q3, 'Itself', FALSE);

    -- Q4: Tree traversal
    INSERT INTO exam_questions (exam_id, question_text, question_type, points, sort_order)
    VALUES (v_exam_id, 'Which traversal visits the root node first?', 'MCQ', 2, 4)
    RETURNING id INTO v_q4;

    INSERT INTO question_options (question_id, option_text, is_correct) VALUES
    (v_q4, 'Inorder', FALSE),
    (v_q4, 'Postorder', FALSE),
    (v_q4, 'Preorder', TRUE),
    (v_q4, 'Level order', FALSE);

    -- Q5: Short answer
    INSERT INTO exam_questions (exam_id, question_text, question_type, points, sort_order)
    VALUES (v_exam_id, 'Explain the difference between a stack and a queue with real-world examples.', 'essay', 5, 5)
    RETURNING id INTO v_q5;

END $$;

-- ============================================
-- SAMPLE QUESTIONS FOR MATH202: Linear Algebra
-- ============================================
DO $$
DECLARE
    v_exam_id UUID;
    v_q1 UUID;
    v_q2 UUID;
    v_q3 UUID;
BEGIN
    SELECT id INTO v_exam_id FROM exams WHERE title = 'MATH202: Linear Algebra' LIMIT 1;
    IF v_exam_id IS NULL THEN RETURN; END IF;
    IF EXISTS (SELECT 1 FROM exam_questions WHERE exam_id = v_exam_id) THEN RETURN; END IF;

    -- Q1: Determinant
    INSERT INTO exam_questions (exam_id, question_text, question_type, points, sort_order)
    VALUES (v_exam_id, 'What is the determinant of a 2×2 identity matrix?', 'MCQ', 3, 1)
    RETURNING id INTO v_q1;

    INSERT INTO question_options (question_id, option_text, is_correct) VALUES
    (v_q1, '0', FALSE),
    (v_q1, '1', TRUE),
    (v_q1, '2', FALSE),
    (v_q1, '-1', FALSE);

    -- Q2: Eigenvalue
    INSERT INTO exam_questions (exam_id, question_text, question_type, points, sort_order)
    VALUES (v_exam_id, 'If Av = λv, then λ is called a(n) _____ of matrix A.', 'MCQ', 3, 2)
    RETURNING id INTO v_q2;

    INSERT INTO question_options (question_id, option_text, is_correct) VALUES
    (v_q2, 'Eigenvector', FALSE),
    (v_q2, 'Eigenvalue', TRUE),
    (v_q2, 'Scalar product', FALSE),
    (v_q2, 'Trace', FALSE);

    -- Q3: Essay
    INSERT INTO exam_questions (exam_id, question_text, question_type, points, sort_order)
    VALUES (v_exam_id, 'Prove that the set of all 2×2 matrices forms a vector space over the real numbers.', 'essay', 10, 3)
    RETURNING id INTO v_q3;

END $$;

