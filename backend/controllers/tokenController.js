const Token = require('../models/token');
const logger = require('../utils/logger');

// Create a new token (Admin/SuperAdmin)
const createToken = async (req, res) => {
  try {
    const { carid, customtokenid, userid, amountpaid, expirydate, status } = req.body;

    const token = new Token({
      carid,
      customtokenid,
      userid,
      amountpaid,
      expirydate,
      status
    });

    await token.save();
    res.status(201).json({ message: 'Token created successfully', token });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Token with this custom ID already exists' });
    }
    logger(`Error in createToken: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all tokens (Admin/SuperAdmin: all tokens, User: own tokens)
const getTokens = async (req, res) => {
  try {
    let filter = {};
    
    // If user, only show their own tokens
    if (req.user.role === 'user') {
      filter.userid = req.user.id;
    }
    
    const tokens = await Token.find(filter)
      .populate('carid userid')
      .sort({ createdAt: -1 });
      
    res.json(tokens);
  } catch (error) {
    logger(`Error in getTokens: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a token by ID (Admin/SuperAdmin: any token, User: own tokens)
const getTokenById = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate('carid userid');
      
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    // If user, check if they own this token
    if (req.user.role === 'user' && token.userid.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to access this token' });
    }
    
    res.json(token);
  } catch (error) {
    logger(`Error in getTokenById: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a token by ID (Admin/SuperAdmin)
const updateToken = async (req, res) => {
  try {
    const { carid, customtokenid, userid, amountpaid, expirydate, status } = req.body;
    
    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    // Only admin/superadmin can update tokens
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Not authorized to update this token' });
    }
    
    const updatedToken = await Token.findByIdAndUpdate(
      req.params.id,
      { carid, customtokenid, userid, amountpaid, expirydate, status },
      { new: true, runValidators: true }
    ).populate('carid userid');
    
    res.json({ 
      message: 'Token updated successfully', 
      token: updatedToken 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Token with this custom ID already exists' });
    }
    logger(`Error in updateToken: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a token by ID (Admin/SuperAdmin)
const deleteToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    // Only admin/superadmin can delete tokens
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Not authorized to delete this token' });
    }
    
    await Token.findByIdAndDelete(req.params.id);
    res.json({ message: 'Token deleted successfully' });
  } catch (error) {
    logger(`Error in deleteToken: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createToken,
  getTokens,
  getTokenById,
  updateToken,
  deleteToken
};