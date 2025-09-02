const Ticket = require('../models/Ticket');
const logger = require('../utils/logger');

// Create a new ticket
const createTicket = async (req, res) => {
  try {
    const {
      userid,
      carid,
      ticketcustomid,
      ticketprice,
      pricepaid,
      pendingamount,
      ticketexpiry,
      ticketbroughtdate,
      comments,
      paymentid,
      ticketstatus,
      resold
    } = req.body;

    const ticket = new Ticket({
      userid,
      carid,
      ticketcustomid,
      ticketprice,
      pricepaid,
      pendingamount,
      ticketexpiry,
      ticketbroughtdate,
      comments,
      paymentid,
      ticketstatus,
      resold,
      createdby: req.user.id,
      createdByModel: req.user.role === 'superadmin' ? 'SuperAdmin' : 'Admin'
    });

    await ticket.save();
    res.status(201).json({
      status: 'success',
      body: { ticket },
      message: 'Ticket created successfully'
    });
  } catch (error) {
    logger(`Error in createTicket: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Get all tickets
const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('userid carid');
    res.json({
      status: 'success',
      body: { tickets },
      message: 'Tickets retrieved successfully'
    });
  } catch (error) {
    logger(`Error in getTickets: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Get a ticket by ID
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('userid carid');
    if (!ticket) {
      return res.status(404).json({
        status: 'failed',
        body: {},
        message: 'Ticket not found'
      });
    }
    res.json({
      status: 'success',
      body: { ticket },
      message: 'Ticket retrieved successfully'
    });
  } catch (error) {
    logger(`Error in getTicketById: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Update a ticket by ID
const updateTicket = async (req, res) => {
  try {
    const {
      userid,
      carid,
      ticketcustomid,
      ticketprice,
      pricepaid,
      pendingamount,
      ticketexpiry,
      ticketbroughtdate,
      comments,
      paymentid,
      ticketstatus,
      resold
    } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        status: 'failed',
        body: {},
        message: 'Ticket not found'
      });
    }

    // Check if user is authorized to update this ticket
    if (ticket.createdby.toString() !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({
        status: 'failed',
        body: {},
        message: 'Not authorized to update this ticket'
      });
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        userid,
        carid,
        ticketcustomid,
        ticketprice,
        pricepaid,
        pendingamount,
        ticketexpiry,
        ticketbroughtdate,
        comments,
        paymentid,
        ticketstatus,
        resold
      },
      { new: true }
    ).populate('userid carid');

    res.json({
      status: 'success',
      body: { ticket: updatedTicket },
      message: 'Ticket updated successfully'
    });
  } catch (error) {
    logger(`Error in updateTicket: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Delete a ticket by ID
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        status: 'failed',
        body: {},
        message: 'Ticket not found'
      });
    }

    // Check if user is authorized to delete this ticket
    if (ticket.createdby.toString() !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({
        status: 'failed',
        body: {},
        message: 'Not authorized to delete this ticket'
      });
    }

    await Ticket.findByIdAndDelete(req.params.id);
    res.json({
      status: 'success',
      body: {},
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    logger(`Error in deleteTicket: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

// Get tickets for the authenticated user
const getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ userid: req.user.id })
      .populate('carid')
      .sort({ createdate: -1 });
    
    res.json({
      status: 'success',
      body: { tickets },
      message: 'User tickets retrieved successfully'
    });
  } catch (error) {
    logger(`Error in getUserTickets: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      body: {},
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getUserTickets
};