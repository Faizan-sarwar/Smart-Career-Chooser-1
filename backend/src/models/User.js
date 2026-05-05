// backend/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email format',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Do not return password by default in queries
    },
    role: {
      type: String,
      enum: ['Student', 'Mentor', 'Admin', 'President'],
      default: 'Student',
    },
    // STATE PERSISTENCE: Storing the avatar securely so it survives page refreshes
    avatar: {
      type: String,
      default: 'default-avatar.png', 
    },
    // Optional fields based on role
    university: {
      type: String,
    },
    careerInterests: {
      type: [String], // Array of strings (e.g., ['Web Development', 'AI'])
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// ==========================================
// PRE-SAVE HOOK: Secure Password Hashing
// ==========================================
// This runs automatically before a user is saved to the database.
userSchema.pre('save', async function (next) {
  // If the password hasn't been modified, skip hashing
  if (!this.isModified('password')) {
    next();
  }

  // Generate salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ==========================================
// INSTANCE METHOD: Verify Password
// ==========================================
// This method allows us to easily compare plain text passwords with the hashed database password during login.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;