const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require admin or superadmin authentication
router.use(authMiddleware(['admin', 'superadmin']));

// Create a new contract
router.post('/', contractController.createContract);

// Get all contracts
router.get('/', contractController.getContracts);

// Get a contract by ID
router.get('/:id', contractController.getContractById);

// Update a contract by ID
router.put('/:id', contractController.updateContract);

// Delete a contract by ID
router.delete('/:id', contractController.deleteContract);

module.exports = router;