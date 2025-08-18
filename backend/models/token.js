const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    carid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        required: true
    },
    customtokenid: {
        type: String,
        required: true,
        unique: true
    },
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amountpaid: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    expirydate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'dropped'],
        default: 'active'
    }
}, {
    timestamps: true
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;