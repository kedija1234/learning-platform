import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './features/auth/auth.routes.js';
import coursesRoutes from './features/courses/courses.routes.js';
import {
  submissionsRouter,
  assignmentSubmissionsRouter,
} from './features/submissions/submissions.routes.js';
import internshipsRoutes from './features/internships/internships.routes.js';
import notificationsRoutes from './features/notifications/notifications.routes.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'University Learning & Internship Platform API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Mount routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
// Submissions: /api/submissions/:id  and  /api/assignments/:id/submissions
app.use('/api/submissions', submissionsRouter);
app.use('/api/assignments', assignmentSubmissionsRouter);
app.use('/api/internships', internshipsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Catch 404 routes
app.use(notFoundHandler);

// Central error handler (must be last)
app.use(errorHandler);

export default app;
