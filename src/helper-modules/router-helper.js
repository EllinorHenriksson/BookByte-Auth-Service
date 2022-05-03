import createError from 'http-errors'
import jwt from 'jsonwebtoken'
import { RefreshToken } from '../models/refreshToken.js'
import { User } from '../models/user.js'

/**
 * Loads the requested user to the request object.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @param {string} id - The id of the user to load.
 */
export async function loadRequestedUser (req, res, next, id) {
  try {
    req.requestedUser = await User.findById(id)

    next()
  } catch (error) {
    next(createError(404, 'The requested resource was not found'))
  }
}

/**
 * Authorizes anonymous users so they can register or authenticate themselves.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export async function authorizeAnonymousUser (req, res, next) {
  try {
    const token = req.cookies.refreshToken
    if (token) {
      const refreshToken = await RefreshToken.findOne({ token }).populate('user')
      if (refreshToken && refreshToken.isActive) {
        throw createError(404)
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Authenticates requests and populates req.authenticatedUser with the user resource object.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export async function authenticateJWT (req, res, next) {
  try {
    const [authenticationScheme, token] = req.headers.authorization?.split(' ')

    if (authenticationScheme !== 'Bearer') {
      throw new Error('Invalid authentication scheme')
    }

    const publicKey = Buffer.from(process.env.PUBLIC_KEY, 'base64')

    const payload = jwt.verify(token, publicKey)

    req.authenticatedUser = await User.findById(payload.sub)

    if (!req.authenticatedUser) {
      throw new Error('User not in database')
    }

    next()
  } catch (err) {
    const error = createError(401, 'JWT invalid or not provided')
    error.cause = err
    next(error)
  }
}
