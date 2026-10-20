-- Sample seed data for local testing ONLY
-- Default test password for all seed accounts: Password123!
-- Hash generated via bcrypt (10 rounds): $2a$10$wTf7pZ780y4gL7O71iE7dOPbX27z3H2X4kS3i3R4t7H4Z5zQ6zYwK (or inserted dynamically by seedDb.js)

-- Sample Users
INSERT IGNORE INTO users (id, first_name, last_name, email, password_hash, role, is_active)
VALUES
  (1, 'System', 'Admin', 'admin@platform.edu', '$2a$10$64nS3jEsmH1o9bLq6u1rF.U7B64k6z72g6c6iYlE69E81Lq5M2TKe', 'admin', TRUE),
  (2, 'Sarah', 'Connor', 'coordinator@platform.edu', '$2a$10$64nS3jEsmH1o9bLq6u1rF.U7B64k6z72g6c6iYlE69E81Lq5M2TKe', 'coordinator', TRUE),
  (3, 'Alan', 'Turing', 'mentor@platform.edu', '$2a$10$64nS3jEsmH1o9bLq6u1rF.U7B64k6z72g6c6iYlE69E81Lq5M2TKe', 'mentor', TRUE),
  (4, 'Ada', 'Lovelace', 'student@platform.edu', '$2a$10$64nS3jEsmH1o9bLq6u1rF.U7B64k6z72g6c6iYlE69E81Lq5M2TKe', 'student', TRUE);

-- Sample Courses
INSERT IGNORE INTO courses (id, mentor_id, title, description)
VALUES
  (1, 3, 'Full Stack Web Development with Node.js & React', 'Comprehensive course covering modern full stack engineering, RESTful APIs, MySQL, and responsive user interfaces.'),
  (2, 3, 'Database Engineering with MySQL and TiDB', 'Deep dive into relational database design, indexing strategies, transactions, and distributed SQL with TiDB.');

-- Sample Resources
INSERT IGNORE INTO resources (id, course_id, title, link_or_text)
VALUES
  (1, 1, 'Official React Documentation', 'https://react.dev'),
  (2, 1, 'Express.js v5 Official Guide', 'https://expressjs.com'),
  (3, 2, 'TiDB Cloud Quickstart Documentation', 'https://docs.pingcap.com/tidbcloud');

-- Sample Assignments
INSERT IGNORE INTO assignments (id, course_id, title, instructions, due_date)
VALUES
  (1, 1, 'Milestone 1: Build Health and Auth REST Endpoints', 'Implement user registration, JWT authentication, and structured error handling.', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY)),
  (2, 2, 'Lab 1: Design Normalized 3NF Database Schema', 'Design normalized tables with foreign keys and cascade delete rules.', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 14 DAY));

-- Sample Enrollments
INSERT IGNORE INTO enrollments (id, student_id, course_id, progress_percent)
VALUES
  (1, 4, 1, 25);

-- Sample Internships
INSERT IGNORE INTO internships (id, coordinator_id, title, organization_name, description, deadline)
VALUES
  (1, 2, 'Full Stack Software Engineer Intern', 'Brolf Tech', 'Join our engineering team to build scalable cloud-native web applications using modern JavaScript and SQL.', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)),
  (2, 2, 'Cloud Systems & DevOps Intern', 'Apex Solutions', 'Collaborate with infrastructure engineers on CI/CD pipelines and database management.', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 45 DAY));

-- Sample Applications
INSERT IGNORE INTO applications (id, internship_id, student_id, status)
VALUES
  (1, 1, 4, 'pending');

-- Sample Notifications
INSERT IGNORE INTO notifications (id, user_id, type, message, link_path)
VALUES
  (1, 4, 'welcome', 'Welcome to the University Learning & Internship Platform! Explore courses and internships today.', '/courses');
