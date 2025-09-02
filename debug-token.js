// Debug script to verify JWT token
const jwt = require('jsonwebtoken');

// Replace this with your actual token from localStorage
const token = 'YOUR_TOKEN_HERE';
const JWT_SECRET = 'your_jwt_secret'; // or your actual JWT secret

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Token is valid!');
  console.log('Decoded token:', decoded);
  console.log('User role:', decoded.role);
  console.log('User ID:', decoded.id);
  console.log('Email:', decoded.email);
} catch (error) {
  console.log('Token is invalid:', error.message);
}

