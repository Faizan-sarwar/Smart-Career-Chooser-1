// src/utils/generateToken.js
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  // Signs a token with the user's ID and Role, expiring in 30 days
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export default generateToken;