const Booking = require('../models/booking');
const logger = require('../utils/logger');

// Create a new booking (User)
const createBooking = async (req, res) => {
  try {
    const { carid, bookingFrom, bookingTo, comments } = req.body;

    const booking = new Booking({
      carid,
      userid: req.user.id,
      bookingFrom,
      bookingTo,
      comments
    });

    await booking.save();
    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    logger(`Error in createBooking: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all bookings (User: own bookings, Admin/SuperAdmin: all bookings)
const getBookings = async (req, res) => {
  try {
    let filter = {};
    
    // If user, only show their own bookings
    if (req.user.role === 'user') {
      filter.userid = req.user.id;
    }
    
    const bookings = await Booking.find(filter)
      .populate('carid userid')
      .sort({ createdAt: -1 });
      
    res.json(bookings);
  } catch (error) {
    logger(`Error in getBookings: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('carid userid');
      
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // If user, check if they own this booking
    if (req.user.role === 'user' && booking.userid.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to access this booking' });
    }
    
    res.json(booking);
  } catch (error) {
    logger(`Error in getBookingById: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update booking status (Admin/SuperAdmin)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Only admin/superadmin can update booking status
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Not authorized to update booking status' });
    }
    
    booking.status = status;
    booking.acceptedby = req.user.id;
    booking.acceptedByModel = req.user.role === 'superadmin' ? 'SuperAdmin' : 'Admin';
    
    await booking.save();
    
    const updatedBooking = await Booking.findById(req.params.id)
      .populate('carid userid');
      
    res.json({ 
      message: `Booking ${status} successfully`, 
      booking: updatedBooking 
    });
  } catch (error) {
    logger(`Error in updateBookingStatus: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a booking (User: own bookings, Admin/SuperAdmin: all bookings)
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Users can only delete their own bookings, admin/superadmin can delete any
    if (req.user.role === 'user' && booking.userid.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this booking' });
    }
    
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    logger(`Error in deleteBooking: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking
};