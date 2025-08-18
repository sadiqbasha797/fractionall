const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, dateofbirth, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      dateofbirth,
      address
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateofbirth: user.dateofbirth,
        address: user.address,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    logger(`Error in registerUser: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'User logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateofbirth: user.dateofbirth,
        address: user.address,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    logger(`Error in loginUser: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Register Admin
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, permissions } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin
    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
      phone,
      permissions
    });

    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    logger(`Error in registerAdmin: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login Admin
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Admin logged in successfully',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    logger(`Error in loginAdmin: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Register Super Admin
const registerSuperAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, permissions } = req.body;

    // Check if super admin already exists
    const existingSuperAdmin = await SuperAdmin.findOne({ email });
    if (existingSuperAdmin) {
      return res.status(400).json({ error: 'Super Admin already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new super admin
    const superAdmin = new SuperAdmin({
      name,
      email,
      password: hashedPassword,
      phone,
      permissions
    });

    await superAdmin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: superAdmin._id, email: superAdmin.email, role: 'superadmin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Super Admin registered successfully',
      token,
      superAdmin: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        phone: superAdmin.phone,
        role: superAdmin.role,
        permissions: superAdmin.permissions
      }
    });
  } catch (error) {
    logger(`Error in registerSuperAdmin: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login Super Admin
const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find super admin by email
    const superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: superAdmin._id, email: superAdmin.email, role: 'superadmin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Super Admin logged in successfully',
      token,
      superAdmin: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        phone: superAdmin.phone,
        role: superAdmin.role,
        permissions: superAdmin.permissions
      }
    });
  } catch (error) {
    logger(`Error in loginSuperAdmin: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    let profile;

    if (user.role === 'user') {
      profile = await User.findById(user.id).select('-password');
    } else if (user.role === 'admin') {
      profile = await Admin.findById(user.id).select('-password');
    } else if (user.role === 'superadmin') {
      profile = await SuperAdmin.findById(user.id).select('-password');
    }

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: profile });
  } catch (error) {
    logger(`Error in getProfile: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  registerAdmin,
  loginAdmin,
  registerSuperAdmin,
  loginSuperAdmin,
  getProfile
};