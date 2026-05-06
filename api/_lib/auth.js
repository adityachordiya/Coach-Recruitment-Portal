const jwt = require('jsonwebtoken');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function getTokenFromRequest(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

function requireAuth(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  try {
    return verifyToken(token);
  } catch {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
}

function requireOwner(req) {
  const payload = requireAuth(req);
  if (payload.role !== 'owner') {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  return payload;
}

module.exports = { signToken, verifyToken, getTokenFromRequest, requireAuth, requireOwner };
