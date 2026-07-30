import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { ApiError, asyncHandler } from '../middleware/errors.js'

const router = Router()

/**
 *  12h expiry: covers a full shift, so entries queued offline during the day
 *  can still sync with the same token at end of shift. 
 */
const TOKEN_TTL = '12h'

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body ?? {}
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new ApiError(400, 'VALIDATION_ERROR', 'username and password are required')
    }

    const { rows } = await pool.query(
      'SELECT id, username, password_hash, name FROM users WHERE username = $1',
      [username]
    )
    const user = rows[0]
    const ok = user && (await bcrypt.compare(password, user.password_hash))
    if (!ok) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid username or password')
    }

    const token = jwt.sign(
      { sub: user.id, username: user.username, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    )

    res.json({ data: { token, user: { id: user.id, username: user.username, name: user.name } } })
  })
)

export default router
