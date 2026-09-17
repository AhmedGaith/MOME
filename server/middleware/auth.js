const jwt = require('jsonwebtoken');
const { getUserById, formatUser } = require('./authHelpers');

function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'You must be logged in to do that.' });
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

function authOptional(req, _res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    req.auth = null;
    return next();
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.auth = null;
  }

  next();
}

function adminRequired(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Admin access required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    req.auth = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Admin session expired.' });
  }
}

module.exports = {
  signToken,
  authRequired,
  authOptional,
  adminRequired,
  getUserById,
  formatUser,
  formatProduct: require('./authHelpers').formatProduct,
};
