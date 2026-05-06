// backend/src/models/Post.js
import mongoose from 'mongoose';

// New schema to hold individual comments
const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    aiAuthorName: { type: String }, // In case AI generates comments later
    aiAuthorRole: { type: String },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    aiAuthorName: { type: String }, 
    aiAuthorRole: { type: String }, 
    
    title: { type: String, default: '' },
    body: { type: String, required: true },
    tag: { type: String, default: 'Discussion' },
    
    // Arrays to store real likes and comments
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema], 
  },
  { timestamps: true }
);

export default mongoose.model('Post', postSchema);