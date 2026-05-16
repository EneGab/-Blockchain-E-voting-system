// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

/**
 * Protects voter routes.
 * Expects: Authorization: Bearer <token>
 * Attaches decoded payload to req.voter on success.
 */
function voterAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure this token belongs to a voter (not an admin)
    if (decoded.role !== 'voter') {
      return res.status(403).json({ message: 'Access denied. Invalid token role.' });
    }

    req.voter = decoded; // { id, unique_id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

/**
 * Protects admin routes.
 * Attaches decoded payload to req.admin on success.
 */
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = { voterAuth, adminAuth };
