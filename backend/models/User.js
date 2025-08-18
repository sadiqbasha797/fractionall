
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  dateofbirth: { type: Date },
  address: { type: String },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  kycDocs: [{ type: String }],
  kycApprovedBy: {
    id: { type: mongoose.Schema.Types.ObjectId },
    role: { type: String },
    name: { type: String },
    email: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
