import { Router } from 'express';
import { testConnection } from '../config/db.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    System health check and database connectivity verification
 * @access  Public
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbError = null;

  try {
    await testConnection();
    dbStatus = 'connected';
  } catch (error) {
    dbError = error.message;
  }

  const isHealthy = dbStatus === 'connected';
  const responseCode = isHealthy ? 200 : 503;

  return res.status(responseCode).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: Date.now() - startTime,
      ...(dbError && { error: dbError }),
    },
  });
});

export default router;
