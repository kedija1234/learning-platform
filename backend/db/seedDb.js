import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  // Security guard: Refuse to run seed script when connecting to cloud/SSL database
  if (process.env.DB_SSL === 'true') {
    console.error(
      '\n[SECURITY ALERT] Seed script refused: DB_SSL is set to true.' +
      '\nSeeding is strictly limited to local development to protect live databases.\n'
    );
    process.exit(1);
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const database = process.env.DB_NAME || 'learning_platform';

  console.log(`Connecting to database '${database}' on ${host}:${port}...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
    });

    console.log('Generating bcrypt hash for local test accounts...');
    // Seed password for all test accounts is 'Password123!' (FOR LOCAL TESTING ONLY)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('Password123!', saltRounds);

    console.log('Seeding users (one per role)...');
    const users = [
      ['System', 'Admin', 'admin@platform.edu', passwordHash, 'admin', true],
      ['Sarah', 'Connor', 'coordinator@platform.edu', passwordHash, 'coordinator', true],
      ['Alan', 'Turing', 'mentor@platform.edu', passwordHash, 'mentor', true],
      ['Ada', 'Lovelace', 'student@platform.edu', passwordHash, 'student', true],
    ];

    for (const [first_name, last_name, email, hash, role, is_active] of users) {
      await connection.query(
        `INSERT IGNORE INTO users (first_name, last_name, email, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [first_name, last_name, email, hash, role, is_active]
      );
    }

    // Retrieve user IDs for relational seeding
    const [userRows] = await connection.query(
      `SELECT id, email, role FROM users WHERE email IN (?, ?, ?, ?)`,
      ['admin@platform.edu', 'coordinator@platform.edu', 'mentor@platform.edu', 'student@platform.edu']
    );

    const userMap = {};
    for (const row of userRows) {
      userMap[row.role] = row.id;
    }

    const mentorId = userMap['mentor'];
    const coordinatorId = userMap['coordinator'];
    const studentId = userMap['student'];

    if (mentorId) {
      console.log('Seeding sample courses...');
      await connection.query(
        `INSERT IGNORE INTO courses (id, mentor_id, title, description)
         VALUES
         (1, ?, 'Full Stack Web Development with Node.js & React', 'Comprehensive course covering modern full stack engineering, RESTful APIs, MySQL, and responsive user interfaces.'),
         (2, ?, 'Database Engineering with MySQL and TiDB', 'Deep dive into relational database design, indexing strategies, transactions, and distributed SQL with TiDB.')`,
        [mentorId, mentorId]
      );

      console.log('Seeding sample resources...');
      await connection.query(
        `INSERT IGNORE INTO resources (id, course_id, title, link_or_text)
         VALUES
         (1, 1, 'Official React Documentation', 'https://react.dev'),
         (2, 1, 'Express.js v5 Official Guide', 'https://expressjs.com'),
         (3, 2, 'TiDB Cloud Quickstart Documentation', 'https://docs.pingcap.com/tidbcloud')`
      );

      console.log('Seeding sample assignments...');
      await connection.query(
        `INSERT IGNORE INTO assignments (id, course_id, title, instructions, due_date)
         VALUES
         (1, 1, 'Milestone 1: Build Health and Auth REST Endpoints', 'Implement user registration, JWT authentication, and structured error handling.', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY)),
         (2, 2, 'Lab 1: Design Normalized 3NF Database Schema', 'Design normalized tables with foreign keys and cascade delete rules.', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 14 DAY))`
      );
    }

    if (studentId && mentorId) {
      console.log('Seeding sample enrollment...');
      await connection.query(
        `INSERT IGNORE INTO enrollments (id, student_id, course_id, progress_percent)
         VALUES (1, ?, 1, 25)`,
        [studentId]
      );
    }

    if (coordinatorId) {
      console.log('Seeding sample internships...');
      await connection.query(
        `INSERT IGNORE INTO internships (id, coordinator_id, title, organization_name, description, deadline)
         VALUES
         (1, ?, 'Full Stack Software Engineer Intern', 'Brolf Tech', 'Join our engineering team to build scalable cloud-native web applications using modern JavaScript and SQL.', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)),
         (2, ?, 'Cloud Systems & DevOps Intern', 'Apex Solutions', 'Collaborate with infrastructure engineers on CI/CD pipelines and database management.', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 45 DAY))`,
        [coordinatorId, coordinatorId]
      );
    }

    if (studentId) {
      console.log('Seeding sample application and notification...');
      await connection.query(
        `INSERT IGNORE INTO applications (id, internship_id, student_id, status)
         VALUES (1, 1, ?, 'pending')`,
        [studentId]
      );

      await connection.query(
        `INSERT IGNORE INTO notifications (id, user_id, type, message, link_path)
         VALUES (1, ?, 'welcome', 'Welcome to the University Learning & Internship Platform! Explore courses and internships today.', '/courses')`,
        [studentId]
      );
    }

    console.log('\n[SUCCESS] Seed data inserted successfully for local testing.');
    console.log('Sample accounts available (Password: Password123!):');
    console.log(' - Admin: admin@platform.edu');
    console.log(' - Coordinator: coordinator@platform.edu');
    console.log(' - Mentor: mentor@platform.edu');
    console.log(' - Student: student@platform.edu\n');
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
