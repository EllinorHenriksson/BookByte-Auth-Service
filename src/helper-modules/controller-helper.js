import jwt from 'jsonwebtoken'
import createError from 'http-errors'
import crypto from 'crypto'
import { RefreshToken } from '../models/refreshToken.js'

/**
 * Creates and returns a JWT.
 *
 * @param {object} user - The user resurce object to create the JWT for.
 * @returns {string} The JWT.
 */
export function createJwt (user) {
  const payload = {
    sub: user.id
  }

  const privateKey = Buffer.from(process.env.PRIVATE_KEY, 'base64')

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: process.env.JWT_LIFE_LENGTH
  })
}

/**
 * Creates and returns a new refresh token.
 *
 * @param {object} user - The user resource object.
 * @param {string} ipAddress - The IP address of the user.
 * @returns {object} The new refresh token resource object.
 */
export function createRefreshToken (user, ipAddress) {
  return new RefreshToken({
    user: user._id,
    token: crypto.randomBytes(40).toString('hex'),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    createdByIp: ipAddress
  })
}

/**
 * Retrieves a refresh token from the database.
 *
 * @param {string} token - The refresh token.
 * @returns {object} The refresh token resource object.
 */
export async function getRefreshToken (token) {
  // Check if cookie with refresh token is provided.
  if (!token) {
    throw createError(401, 'Refresh token invalid or not provided')
  }

  // Retreive and check refresh token.
  const refreshToken = await RefreshToken.findOne({ token }).populate('user')
  if (!refreshToken || !refreshToken.isActive) {
    throw createError(401, 'Refresh token invalid or not provided')
  }
  return refreshToken
}

/**
 * Sets a cookie for the refresh token in response header.
 *
 * @param {object} res - The response object.
 * @param {string} token - The refresh token.
 */
export function setTokenCookie (res, token) {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days.
    sameSite: 'strict'
  }

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.sameSite = 'none' // I know that it is very unsafe to set sameSite to none, but since the client application is deployed with Netlify and doesn't run on the same server as Auth Service I had to do it. I've discussed the matter with Johan who gave me permission to do it.
    cookieOptions.secure = true
  }

  res.cookie('refreshToken', token, cookieOptions)
}
