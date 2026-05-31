// backend/src/models/PasswordReset.js
//
// Stores password reset attempts. Both the link token and the OTP are
// stored as bcrypt hashes (never plain text). MongoDB's TTL index auto-
// deletes expired documents.

import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Hashed values — never the raw token/OTP
    tokenHash: { type: String, required: true },
    otpHash: { type: String, required: true },
    // Bookkeeping
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 }, // failed OTP attempts (max 5)
    requestIp: { type: String, default: '' },
  },
  { timestamps: true }
);

// TTL: MongoDB will auto-delete documents whose expiresAt has passed.
// Note: TTL precision is ~60s — that's fine here, the controller checks too.
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);
export default PasswordReset;