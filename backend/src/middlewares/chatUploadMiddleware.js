// backend/src/middlewares/chatUploadMiddleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const dir = 'uploads/chat';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) { cb(null, dir); },
  filename(req, file, cb) {
    cb(null, `media_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed!'), false);
  }
};

export const chatUpload = multer({ 
  storage, 
  fileFilter, 
  limits: { fileSize: 25000000 } // 25MB limit for videos/photos
});