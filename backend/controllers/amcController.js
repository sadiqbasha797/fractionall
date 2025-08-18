const AMC = require('../models/amc');
const logger = require('../utils/logger');

// Create a new AMC
const createAMC = async (req, res) => {
  try {
    const { userid, carid, ticketid, amcamount } = req.body;

    const amc = new AMC({
      userid,
      carid,
      ticketid,
      amcamount
    });

    await amc.save();
    res.status(201).json({ message: 'AMC created successfully', amc });
  } catch (error) {
    logger(`Error in createAMC: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all AMC records
const getAMCs = async (req, res) => {
  try {
    // If user is not admin/superadmin, only show their own AMC records
    const filter = (req.user.role === 'user') ? { userid: req.user.id } : {};
    
    const amcs = await AMC.find(filter).populate('userid carid ticketid');
    res.json(amcs);
  } catch (error) {
    logger(`Error in getAMCs: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get an AMC by ID
const getAMCById = async (req, res) => {
  try {
    const amc = await AMC.findById(req.params.id).populate('userid carid ticketid');
    if (!amc) {
      return res.status(404).json({ error: 'AMC not found' });
    }

    // If user is not admin/superadmin, check if they own this AMC
    if (req.user.role === 'user' && amc.userid.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to access this AMC' });
    }

    res.json(amc);
  } catch (error) {
    logger(`Error in getAMCById: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update an AMC by ID
const updateAMC = async (req, res) => {
  try {
    const { amcamount } = req.body;

    const amc = await AMC.findById(req.params.id);
    if (!amc) {
      return res.status(404).json({ error: 'AMC not found' });
    }

    // If user is not admin/superadmin, check if they own this AMC
    if (req.user.role === 'user' && amc.userid.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this AMC' });
    }

    const updatedAMC = await AMC.findByIdAndUpdate(
      req.params.id,
      { amcamount },
      { new: true }
    ).populate('userid carid ticketid');

    res.json({ message: 'AMC updated successfully', amc: updatedAMC });
  } catch (error) {
    logger(`Error in updateAMC: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete an AMC by ID
const deleteAMC = async (req, res) => {
  try {
    const amc = await AMC.findById(req.params.id);
    if (!amc) {
      return res.status(404).json({ error: 'AMC not found' });
    }

    // If user is not admin/superadmin, check if they own this AMC
    if (req.user.role === 'user' && amc.userid.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this AMC' });
    }

    await AMC.findByIdAndDelete(req.params.id);
    res.json({ message: 'AMC deleted successfully' });
  } catch (error) {
    logger(`Error in deleteAMC: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update AMC payment status
const updateAMCPaymentStatus = async (req, res) => {
  try {
    const { yearIndex, paid, paiddate } = req.body;

    const amc = await AMC.findById(req.params.id);
    if (!amc) {
      return res.status(404).json({ error: 'AMC not found' });
    }

    // If user is not admin/superadmin, check if they own this AMC
    if (req.user.role === 'user' && amc.userid.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this AMC' });
    }

    // Update the specific year's payment status
    if (amc.amcamount[yearIndex]) {
      amc.amcamount[yearIndex].paid = paid;
      if (paiddate) {
        amc.amcamount[yearIndex].paiddate = paiddate;
      }
      await amc.save();
      
      const updatedAMC = await AMC.findById(req.params.id).populate('userid carid ticketid');
      res.json({ message: 'AMC payment status updated successfully', amc: updatedAMC });
    } else {
      res.status(400).json({ error: 'Invalid year index' });
    }
  } catch (error) {
    logger(`Error in updateAMCPaymentStatus: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createAMC,
  getAMCs,
  getAMCById,
  updateAMC,
  deleteAMC,
  updateAMCPaymentStatus
};