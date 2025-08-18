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
    res.status(201).json({ message: 'Ticket created successfully', ticket });
  } catch (error) {
    logger(`Error in createTicket: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all tickets
const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('userid carid paymentid');
    res.json(tickets);
  } catch (error) {
    logger(`Error in getTickets: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a ticket by ID
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('userid carid paymentid');
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    logger(`Error in getTicketById: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
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
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user is authorized to update this ticket
    if (ticket.createdby.toString() !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Not authorized to update this ticket' });
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
    ).populate('userid carid paymentid');

    res.json({ message: 'Ticket updated successfully', ticket: updatedTicket });
  } catch (error) {
    logger(`Error in updateTicket: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a ticket by ID
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user is authorized to delete this ticket
    if (ticket.createdby.toString() !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Not authorized to delete this ticket' });
    }

    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    logger(`Error in deleteTicket: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket
};