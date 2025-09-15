const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/booking');
const AMC = require('../models/amc');
const Ticket = require('../models/Ticket');
const Token = require('../models/token');
const BookNowToken = require('../models/bookNowToken');
const Contract = require('../models/contract');
const ContactForm = require('../models/ContactForm');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Dashboard stats request received');
    console.log('📊 Checking database connection...');
    
    // Simple test query first
    try {
      const testCount = await Car.countDocuments();
      console.log('✅ Car model connection test passed, found:', testCount, 'cars');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: dbError.message
      });
    }
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    console.log('📊 Starting data collection...');

    // Car Statistics
    console.log('📊 Fetching car statistics...');
    const totalCars = await Car.countDocuments();
    const activeCars = await Car.countDocuments({ status: 'active' });
    const pendingCars = await Car.countDocuments({ status: 'pending' });
    const carsThisMonth = await Car.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    console.log('✅ Car stats:', { totalCars, activeCars, pendingCars, carsThisMonth });

    // User Statistics
    console.log('📊 Fetching user statistics...');
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const kycApprovedUsers = await User.countDocuments({ kycStatus: 'approved' });
    const usersThisMonth = await User.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    console.log('✅ User stats:', { totalUsers, verifiedUsers, kycApprovedUsers, usersThisMonth });

    // Booking Statistics
    console.log('📊 Fetching booking statistics...');
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: 'active' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const bookingsThisMonth = await Booking.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    const bookingsThisWeek = await Booking.countDocuments({ 
      createdAt: { $gte: startOfWeek } 
    });
    console.log('✅ Booking stats:', { totalBookings, activeBookings, completedBookings });

    // AMC Statistics
    console.log('📊 Fetching AMC statistics...');
    const totalAmcs = await AMC.countDocuments();
    const activeAmcs = await AMC.countDocuments({ status: 'active' });
    const expiredAmcs = await AMC.countDocuments({ status: 'expired' });
    const amcsThisMonth = await AMC.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    console.log('✅ AMC stats:', { totalAmcs, activeAmcs, expiredAmcs });

    // Ticket Statistics
    console.log('📊 Fetching ticket statistics...');
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: 'open' });
    const closedTickets = await Ticket.countDocuments({ status: 'closed' });
    const ticketsThisWeek = await Ticket.countDocuments({ 
      createdAt: { $gte: startOfWeek } 
    });
    console.log('✅ Ticket stats:', { totalTickets, openTickets, closedTickets });

    // Token Statistics
    console.log('📊 Fetching token statistics...');
    const totalTokens = await Token.countDocuments();
    const tokensThisMonth = await Token.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    
    const totalBookNowTokens = await BookNowToken.countDocuments();
    const bookNowTokensThisMonth = await BookNowToken.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    console.log('✅ Token stats:', { totalTokens, totalBookNowTokens });

    // Contract Statistics
    console.log('📊 Fetching contract statistics...');
    const totalContracts = await Contract.countDocuments();
    const activeContracts = await Contract.countDocuments({ status: 'active' });
    const contractsThisMonth = await Contract.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    console.log('✅ Contract stats:', { totalContracts, activeContracts });

    // Contact Form Statistics
    console.log('📊 Fetching contact form statistics...');
    const totalContactForms = await ContactForm.countDocuments();
    const unreadContactForms = await ContactForm.countDocuments({ status: 'pending' });
    console.log('✅ Contact form stats:', { totalContactForms, unreadContactForms });

    // Revenue Statistics
    console.log('📊 Fetching revenue statistics...');
    
    // Ticket Revenue - use pricepaid field
    const ticketRevenue = await Ticket.aggregate([
      { $group: { _id: null, total: { $sum: '$pricepaid' } } }
    ]);

    // AMC Revenue - sum all paid amounts from amcamount array
    const amcRevenue = await AMC.aggregate([
      { $unwind: '$amcamount' },
      { $match: { 'amcamount.paid': true } },
      { $group: { _id: null, total: { $sum: '$amcamount.amount' } } }
    ]);

    // Token Revenue - use amountpaid field
    const tokenRevenue = await Token.aggregate([
      { $group: { _id: null, total: { $sum: '$amountpaid' } } }
    ]);

    // BookNowToken Revenue - use amountpaid field
    const bookNowTokenRevenue = await BookNowToken.aggregate([
      { $group: { _id: null, total: { $sum: '$amountpaid' } } }
    ]);

    const totalRevenue = (ticketRevenue[0]?.total || 0) + 
                        (amcRevenue[0]?.total || 0) + 
                        (tokenRevenue[0]?.total || 0) + 
                        (bookNowTokenRevenue[0]?.total || 0);
    
    console.log('💰 Revenue breakdown:');
    console.log('  Tickets:', ticketRevenue[0]?.total || 0);
    console.log('  AMC:', amcRevenue[0]?.total || 0);
    console.log('  Tokens:', tokenRevenue[0]?.total || 0);
    console.log('  BookNow Tokens:', bookNowTokenRevenue[0]?.total || 0);
    console.log('✅ Total Revenue calculated:', totalRevenue);

    // Recent Activity
    console.log('📊 Fetching recent activity...');
    const recentBookings = await Booking.find()
      .populate('userid', 'name email')
      .populate('carid', 'carname brand')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentTickets = await Ticket.find()
      .populate('userid', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);
    console.log('✅ Recent activity fetched:', { bookingsCount: recentBookings.length, ticketsCount: recentTickets.length });

    console.log('✅ All data collected successfully, sending response...');
    res.json({
      success: true,
      data: {
        overview: {
          totalCars,
          activeCars,
          pendingCars,
          carsThisMonth,
          totalUsers,
          verifiedUsers,
          kycApprovedUsers,
          usersThisMonth,
          totalBookings,
          activeBookings,
          completedBookings,
          bookingsThisMonth,
          bookingsThisWeek,
          totalAmcs,
          activeAmcs,
          expiredAmcs,
          amcsThisMonth,
          totalTickets,
          openTickets,
          closedTickets,
          ticketsThisWeek,
          totalTokens,
          tokensThisMonth,
          totalBookNowTokens,
          bookNowTokensThisMonth,
          totalContracts,
          activeContracts,
          contractsThisMonth,
          totalContactForms,
          unreadContactForms,
          totalRevenue
        },
        revenue: {
          total: totalRevenue,
          breakdown: {
            tickets: ticketRevenue[0]?.total || 0,
            amc: amcRevenue[0]?.total || 0,
            tokens: tokenRevenue[0]?.total || 0,
            bookNowTokens: bookNowTokenRevenue[0]?.total || 0
          },
          monthlyTrend: {
            bookings: [],
            amc: []
          }
        },
        recentActivity: {
          bookings: recentBookings,
          tickets: recentTickets
        }
      }
    });
    console.log('✅ Response sent successfully!');
  } catch (error) {
    console.error('🔥 Dashboard stats error:', error);
    console.error('🔥 Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get car distribution by brand
const getCarDistribution = async (req, res) => {
  try {
    const carDistribution = await Car.aggregate([
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: carDistribution
    });
  } catch (error) {
    console.error('Car distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch car distribution',
      error: error.message
    });
  }
};

// Get booking trends (daily for the last 30 days)
const getBookingTrends = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      success: true,
      data: bookingTrends
    });
  } catch (error) {
    console.error('Booking trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking trends',
      error: error.message
    });
  }
};

// Get top performing cars
const getTopPerformingCars = async (req, res) => {
  try {
    const topCars = await Booking.aggregate([
      {
        $group: {
          _id: '$carid',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'cars',
          localField: '_id',
          foreignField: '_id',
          as: 'car'
        }
      },
      { $unwind: '$car' },
      {
        $project: {
          carname: '$car.carname',
          brand: '$car.brand',
          totalBookings: 1,
          totalRevenue: 1,
          image: { $arrayElemAt: ['$car.images', 0] }
        }
      },
      { $sort: { totalBookings: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: topCars
    });
  } catch (error) {
    console.error('Top performing cars error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top performing cars',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getCarDistribution,
  getBookingTrends,
  getTopPerformingCars
};