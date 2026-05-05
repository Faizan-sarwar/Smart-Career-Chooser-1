import Post from '../models/Post.js';

// 1. Fetch Real Posts from the Database
export const getFeed = async (req, res, next) => {
  try {
    // Finds all posts in MongoDB, sorts by newest first
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

// 2. Save a Real Post to the Database
export const createPost = async (req, res, next) => {
  try {
    const { body } = req.body;
    
    // Creates a new record in MongoDB
    const newPost = await Post.create({
      authorName: req.user.name,       // Pulled from the live, logged-in user
      authorRole: req.user.role,
      authorId: req.user._id,
      title: body.split("\n")[0].slice(0, 50), 
      body: body,
      tag: "Discussion"
    });

    res.status(201).json(newPost);
  } catch (error) {
    next(error);
  }
};