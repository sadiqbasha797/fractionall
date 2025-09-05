
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const CronService = require('./utils/cronService');

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

// Serve test page
app.get('/test-razorpay', (req, res) => {
  res.sendFile(__dirname + '/test-razorpay.html');
});

// Get Razorpay Key ID for frontend
app.get('/api/razorpay-key', (req, res) => {
  res.json({ key: process.env.RAZOR_PAY_KEY_ID });
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

// Contact routes
const contactRoutes = require('./routes/contactRoutes');
app.use('/api/contact', contactRoutes);

// Payment routes
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

// Notification routes
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

// AMC Reminder routes
const amcReminderRoutes = require('./routes/amcReminderRoutes');
app.use('/api/amc-reminders', amcReminderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start cron jobs for scheduled tasks
  CronService.startCronJobs();
});
