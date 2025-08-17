
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  kycDocs: [{ type: String }],
  kycApprovedBy: {
    id: { type: mongoose.Schema.Types.ObjectId },
    role: { type: String },
    name: { type: String },
    email: { type: String }
  },
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  resaleRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resale' }],
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
