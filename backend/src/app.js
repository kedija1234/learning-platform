import express from 'express';
import corsMiddleware from './config/cors.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './features/auth/auth.routes.js';
import coursesRoutes from './features/courses/courses.routes.js';
import {
  submissionsRouter,
  assignmentSubmissionsRouter,
} from './features/submissions/submissions.routes.js';
import internshipsRoutes from './features/internships/internships.routes.js';
import notificationsRoutes from './features/notifications/notifications.routes.js';
import adminRoutes from './features/admin/admin.routes.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Core middleware: strict CORS origin validation, JSON & form parsers
app.use(corsMiddleware);
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
app.use('/api/admin', adminRoutes);

// Catch 404 routes
app.use(notFoundHandler);

// Central error handler (must be last)
app.use(errorHandler);

export default app;
