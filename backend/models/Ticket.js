const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    carid: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    ticketcustomid: { type: String, required: true },
    ticketprice: { type: Number, required: true },
    pricepaid: { type: Number, required: true },
    pendingamount: { type: Number, required: true },
    ticketexpiry: { type: Date, required: true },
    ticketbroughtdate: { type: Date, required: true },
    comments: { type: String },
    paymentid: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    ticketstatus: { type: String, enum: ['active', 'expired', 'cancelled'], required: true },
    resold: { type: Boolean, required: true },
    createdby: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'createdByModel' },
    createdByModel: { type: String, required: true, enum: ['Admin', 'SuperAdmin'] },
    createdate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);