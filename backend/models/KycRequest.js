const mongoose = require('mongoose');

const KycRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documents: [{ type: String, required: true }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  reviewedBy: {
    id: { type: mongoose.Schema.Types.ObjectId },
    role: { type: String },
    name: { type: String },
    email: { type: String }
  },
  reviewedAt: { type: Date }
});

module.exports = mongoose.model('KycRequest', KycRequestSchema);
