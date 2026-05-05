import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  authorRole: { type: String, required: true }, // e.g., 'Student', 'Mentor'
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Links to the real user
  title: { type: String, required: true },
  body: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of real users who liked it
  comments: { type: Number, default: 0 },
  tag: { type: String, default: 'Discussion' }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt dates!
});

export default mongoose.model('Post', postSchema);