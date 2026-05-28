// backend/src/middlewares/cvUploadMiddleware.js
//
// Multer config for CV uploads. PDF only, 5MB max.

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const dir = 'uploads/cv';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `cv_${req.user._id}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for CVs'), false);
  }
};

export const cvUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});