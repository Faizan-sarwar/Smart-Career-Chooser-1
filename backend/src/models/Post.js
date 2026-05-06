// backend/src/models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: '', trim: true },
    body: { type: String, required: true, trim: true },
    tag: {
      type: String,
      enum: ['Discussion', 'Question', 'Insight', 'Resource', 'News', 'Career'],
      default: 'Discussion',
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        body: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);
export default Post;