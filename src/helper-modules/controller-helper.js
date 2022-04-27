import jwt from 'jsonwebtoken'
import createError from 'http-errors'
import crypto from 'crypto'
import { RefreshToken } from '../models/refreshToken.js'

/**
 * Creates and returns a JWT token.
 *
 * @param {object} user - The user resurce object to create the JWT for.
 * @returns {string} The JWT token.
 */
export function createJwtToken (user) {
  const payload = {
    sub: user.id,
    preferred_username: user.username,
    given_name: user.givenName,
    family_name: user.familyName,
    email: user.email
  }

  const privateKey = Buffer.from(process.env.PRIVATE_KEY, 'base64')

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: process.env.ACCESS_TOKEN_LIFE
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
    throw createError(400, 'Token is required')
  }

  // Retreive and check refresh token.
  const refreshToken = await RefreshToken.findOne({ token })
  if (!refreshToken || !refreshToken.isActive) {
    throw createError(401, 'Invalid token')
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

  res.cookie('refreshToken', token, cookieOptions)
}