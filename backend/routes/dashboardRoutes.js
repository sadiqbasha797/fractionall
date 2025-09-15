const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getCarDistribution,
  getBookingTrends,
  getTopPerformingCars
} = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all dashboard routes (temporarily disabled for debugging)
// router.use(authMiddleware);

// Test route to verify API is working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Dashboard API is working!',
    timestamp: new Date().toISOString()
  });
});

// Dashboard statistics overview
router.get('/stats', getDashboardStats);

// Car distribution by brand
router.get('/cars/distribution', getCarDistribution);

// Booking trends (daily for last 30 days)
router.get('/bookings/trends', getBookingTrends);

// Top performing cars
router.get('/cars/top-performing', getTopPerformingCars);

module.exports = router;