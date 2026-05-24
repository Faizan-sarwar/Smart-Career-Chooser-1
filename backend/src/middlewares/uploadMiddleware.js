// backend/src/middlewares/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Automatically create the uploads folder if it doesn't exist
const dir = 'uploads/cvs';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, dir);
  },
  filename(req, file, cb) {
    // Save as: Name_1683401239.pdf
    const safeName = req.body.name ? req.body.name.replace(/\s+/g, '_') : 'User';
    cb(null, `${safeName}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const checkFileType = (file, cb) => {
  // Allow PDFs and Word Docs
  const filetypes = /pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Multer sometimes struggles with docx mimetypes, so we rely heavily on extension here
  const mimetype = filetypes.test(file.mimetype) || file.mimetype.includes('officedocument') || file.mimetype.includes('msword');

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only .pdf, .doc, and .docx files are allowed!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

export default upload;