const jwt = require('jsonwebtoken')
const db = require('./db')

const JWT_SECRET = process.env.FRAGAFUT_JWT_SECRET || 'fragafut-dev-secret-change-in-production'
const JWT_EXPIRES = '7d'

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Não autenticado' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Sessão inválida' })
  }
}

function roles(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    next()
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET) } catch { /* ignore */ }
  }
  next()
}

function publicUser(row) {
  if (!row) return null
  const { password_hash, reset_token, reset_expires, ...safe } = row
  return safe
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
}

module.exports = {
  JWT_SECRET,
  signToken,
  authRequired,
  roles,
  optionalAuth,
  publicUser,
  getUserById
}
