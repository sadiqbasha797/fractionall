
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:4200', // Angular default port
  credentials: true
}));

// Connect to database
connectDB();

// Basic route for health check
app.get('/', (req, res) => {
  res.json({ message: 'Server is running', status: 'OK' });
});

// Authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Car routes
const carRoutes = require('./routes/carRoutes');
app.use('/api/cars', carRoutes);

// Ticket routes
const ticketRoutes = require('./routes/ticketRoutes');
app.use('/api/tickets', ticketRoutes);

// AMC routes
const amcRoutes = require('./routes/amcRoutes');
app.use('/api/amcs', amcRoutes);

// Booking routes
const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

// Contract routes
const contractRoutes = require('./routes/contractRoutes');
app.use('/api/contracts', contractRoutes);

// Token routes
const tokenRoutes = require('./routes/tokenRoutes');
app.use('/api/tokens', tokenRoutes);

// Book Now Token routes
const bookNowTokenRoutes = require('./routes/bookNowTokenRoutes');
app.use('/api/book-now-tokens', bookNowTokenRoutes);

// Home routes (includes Hero Content, Brands, Simple Steps, and FAQs)
const homeRoutes = require('./routes/homeRoutes');
app.use('/api/home', homeRoutes);

// KYC routes
const kycRoutes = require('./routes/kycRoutes');
app.use('/api/kyc', kycRoutes);

// User routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
