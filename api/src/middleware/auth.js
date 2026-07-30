import jwt from 'jsonwebtoken'
import { ApiError } from './errors.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Missing or malformed Authorization header'))
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, username: payload.username, name: payload.name }
    next()
  } catch {
    next(new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired token'))
  }
}
