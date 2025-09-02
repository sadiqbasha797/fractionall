const Contract = require('../models/contract');
const logger = require('../utils/logger');

// Create a new contract (Admin/SuperAdmin)
const createContract = async (req, res) => {
  try {
    const { carid, userid, ticketid, contract_docs } = req.body;

    const contract = new Contract({
      carid,
      userid,
      ticketid,
      contract_docs,
      createdby: req.user.id,
      createdByModel: req.user.role === 'superadmin' ? 'SuperAdmin' : 'Admin'
    });

    await contract.save();
    res.status(201).json({
      status: 'success',
      body: { contract },
      message: 'Contract created successfully'
    });
  } catch (error) {
    logger(`Error in createContract: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Get all contracts (Admin/SuperAdmin)
const getContracts = async (req, res) => {
  try {
    const contracts = await Contract.find()
      .populate('carid userid ticketid');
      
    res.json({
      status: 'success',
      body: { contracts },
      message: 'Contracts retrieved successfully'
    });
  } catch (error) {
    logger(`Error in getContracts: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Get a contract by ID (Admin/SuperAdmin)
const getContractById = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('carid userid ticketid');
      
    if (!contract) {
      return res.status(404).json({
        status: 'failed',
        body: {},
        message: 'Contract not found'
      });
    }
    
    res.json({
      status: 'success',
      body: { contract },
      message: 'Contract retrieved successfully'
    });
  } catch (error) {
    logger(`Error in getContractById: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Update a contract by ID (Admin/SuperAdmin)
const updateContract = async (req, res) => {
  try {
    const { contract_docs } = req.body;
    
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({
        status: 'failed',
        body: {},
        message: 'Contract not found'
      });
    }
    
    // Check if user is authorized to update this contract
    if (contract.createdby.toString() !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({
        status: 'failed',
        body: {},
        message: 'Not authorized to update this contract'
      });
    }
    
    const updatedContract = await Contract.findByIdAndUpdate(
      req.params.id,
      { contract_docs },
      { new: true }
    ).populate('carid userid ticketid');
    
    res.json({
      status: 'success',
      body: { contract: updatedContract },
      message: 'Contract updated successfully'
    });
  } catch (error) {
    logger(`Error in updateContract: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Delete a contract by ID (Admin/SuperAdmin)
const deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({
        status: 'failed',
        body: {},
        message: 'Contract not found'
      });
    }
    
    // Check if user is authorized to delete this contract
    if (contract.createdby.toString() !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({
        status: 'failed',
        body: {},
        message: 'Not authorized to delete this contract'
      });
    }
    
    await Contract.findByIdAndDelete(req.params.id);
    res.json({
      status: 'success',
      body: {},
      message: 'Contract deleted successfully'
    });
  } catch (error) {
    logger(`Error in deleteContract: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createContract,
  getContracts,
  getContractById,
  updateContract,
  deleteContract
};