import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import MentorRequest from '../models/MentorRequest.js';

export const uploadCV = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Delete old CV from disk if exists
    if (user.cv?.filePath) {
      const oldPath = path.resolve(user.cv.filePath);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.warn('[uploadCV] could not delete old:', e.message); }
      }
    }

    user.cv = {
      fileName: req.file.originalname,
      filePath: req.file.path.replace(/\\/g, '/'),
      fileSize: req.file.size,
      uploadedAt: new Date(),
    };
    await user.save();

    res.status(201).json({
      fileName: user.cv.fileName,
      fileSize: user.cv.fileSize,
      uploadedAt: user.cv.uploadedAt,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCV = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.cv?.filePath) {
      res.status(404);
      throw new Error('No CV to delete');
    }

    const filePath = path.resolve(user.cv.filePath);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.warn('[deleteCV]:', e.message); }
    }

    user.cv = { fileName: null, filePath: null, fileSize: 0, uploadedAt: null };
    await user.save();

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
};


export const viewMenteeCV = async (req, res, next) => {
  try {
    // Privacy: must be an accepted relationship
    const accepted = await MentorRequest.findOne({
      mentor: req.user._id,
      student: req.params.id,
      status: 'accepted',
    });

    if (!accepted) {
      res.status(403);
      throw new Error('This student is not in your accepted roster');
    }

    const student = await User.findById(req.params.id).select('cv name').lean();
    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    // cv is a STRING path
    const cvPath = typeof student.cv === 'string' ? student.cv.trim() : '';
    if (!cvPath) {
      res.status(404);
      throw new Error('This student has not uploaded a CV yet');
    }

    const absolutePath = path.resolve(cvPath);
    if (!fs.existsSync(absolutePath)) {
      res.status(404);
      throw new Error('CV file is missing from server');
    }

    const fileName = cvPath.split('/').pop() || 'cv.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.sendFile(absolutePath);
  } catch (err) {
    next(err);
  }
};

// @desc    Get own CV metadata (for student's profile page to display "uploaded" state)
// @route   GET /api/student/cv
// @access  Private (Student)
export const getMyCV = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('cv').lean();
    if (!user?.cv?.filePath) {
      return res.json({ hasCv: false });
    }
    res.json({
      hasCv: true,
      fileName: user.cv.fileName,
      fileSize: user.cv.fileSize,
      uploadedAt: user.cv.uploadedAt,
    });
  } catch (err) {
    next(err);
  }
};
// @desc    Student views own CV in a new tab
// @route   GET /api/student/cv/view
// @access  Private (Student)
export const viewMyCV = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('cv name').lean();
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // cv may be stored as string path OR as object {filePath, fileName}
    const cvPath = typeof user.cv === 'string'
      ? user.cv.trim()
      : (user.cv?.filePath || '').trim();

    if (!cvPath) {
      res.status(404);
      throw new Error('You have not uploaded a CV yet');
    }

    const absolute = path.resolve(cvPath);
    if (!fs.existsSync(absolute)) {
      res.status(404);
      throw new Error('CV file is missing from server');
    }

    const fileName = (typeof user.cv === 'object' && user.cv?.fileName)
      || cvPath.split('/').pop()
      || 'cv.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.sendFile(absolute);
  } catch (err) {
    next(err);
  }
};