const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    carname: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    milege: {
        type: String,
        required: true
    },
    seating: {
        type: Number,
        required: true
    },
    features: {
        type: [String],
        required: true
    },
    brandname: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    fractionprice: {
        type: Number,
        required: true
    },
    tokenprice: {
        type: Number,
        required: true
    },
    expectedpurchasedate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'cancelled'],
        default: 'pending'
    },
    ticketsavilble: {
        type: Number,
        required: true
    },
    totaltickets: {
        type: Number,
        required: true
    },
    tokensavailble: {
        type: Number,
        required: true
    }
});

const Car = mongoose.model('Car', carSchema);

module.exports = Car;
