const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const authMiddleware = require('../middleware/authMiddleware');

// User routes
router.post('/submit', authMiddleware(['user']), kycController.submitKyc);
router.get('/my-status', authMiddleware(['user']), kycController.getMyKycStatus);

// Admin/SuperAdmin routes
router.get('/requests', authMiddleware(['admin', 'superadmin']), kycController.getAllKycRequests);
router.get('/details/:userId', authMiddleware(['admin', 'superadmin']), kycController.getKycDetails);
router.put('/approve/:userId', authMiddleware(['admin', 'superadmin']), kycController.approveKyc);
router.put('/reject/:userId', authMiddleware(['admin', 'superadmin']), kycController.rejectKyc);

module.exports = router;