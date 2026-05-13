// backend/src/models/User.js
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
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email format',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    // 🚨 THIS WAS THE CULPRIT! Forced everything to strict lowercase 🚨
    role: {
      type: String,
      enum: ['student', 'mentor', 'admin', 'president'],
      default: 'student',
      lowercase: true,
    },
    avatar: {
      type: String,
      default: '👋',
    },
    university: { type: String },
    educationLevel: {
      type: String,
      enum: ['matric', 'intermediate', 'bachelors', 'masters', 'phd', 'other'],
    },
    fieldOfStudy: { type: String },
    careerInterests: { type: [String], default: [] },
    expertise: { type: [String], default: [] },
    yearsOfExperience: { type: Number },
    bio: { type: String, maxlength: 1000 },
    mentorNotes: { type: String, default: '' },
    latestAssessmentResult: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssessmentResult',
      default: null,
    },
    selectedCareer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Career',
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
// CORRECT: Modern async/await without next()
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;