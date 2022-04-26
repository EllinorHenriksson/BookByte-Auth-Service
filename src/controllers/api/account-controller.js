/**
 * Module for the AccountController.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken'
import createError from 'http-errors'
import crypto from 'crypto'
import { User } from '../../models/user.js'
import { RefreshToken } from '../../models/refreshToken.js'

/**
 * Encapsulates a controller.
 */
export class AccountController {
  /**
   * Registers a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async register (req, res, next) {
    try {
      const user = new User({
        username: req.body.username,
        password: req.body.password,
        givenName: req.body.givenName,
        familyName: req.body.familyName,
        email: req.body.email
      })

      await user.save()

      res
        .status(201)
        .json({ id: user.id })
    } catch (error) {
      let err = error

      if (err.code === 11000) {
        // Duplicated keys.
        err = createError(409, 'The username and/or email address already registered.')
        err.cause = error
      } else if (error.name === 'ValidationError') {
        // Validation error(s).
        err = createError(400, error.message)
        err.cause = error
      }

      next(err)
    }
  }

  /**
   * Authenticates a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async login (req, res, next) {
    try {
      const user = await User.authenticate(req.body.username, req.body.password)

      // Create JWT token.
      const jwtToken = this.#createJwtToken(user)

      // Create refresh token.
      const refreshToken = this.#createRefreshToken(user, req.ip)
      await refreshToken.save()

      // Set cookie with refresh token.
      this.#setTokenCookie(res, refreshToken.token)

      res
        .json({
          access_token: jwtToken
        })
    } catch (error) {
      // Authentication failed.
      const err = createError(401)
      err.cause = error

      next(err)
    }
  }

  /**
   * Creates a new refresh token (and JWT token).
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async refreshToken (req, res, next) {
    try {
      // Check refresh token.
      const refreshToken = await RefreshToken.findOne({ token: req.cookies.refreshToken }) // OBS! Fel status 500, kan ej hitta req.cookies!
      if (!refreshToken || !refreshToken.isActive) {
        next(createError(401, 'Invalid token'))
      } else {
        const user = refreshToken.user

        // Create new refresh token and save it.
        const newRefreshToken = this.#createRefreshToken(user, req.ip)
        await newRefreshToken.save()

        // Update old refresh token and save it.
        refreshToken.revoked = Date.now()
        refreshToken.revokedByIp = req.ip
        refreshToken.replacedByToken = newRefreshToken.token
        await refreshToken.save()

        const jwtToken = this.#createJwtToken(user)

        // Set cookie with refresh token.
        this.#setTokenCookie(res, newRefreshToken.token)

        res
          .json({
            access_token: jwtToken
          })
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * Creates and returns a JWT token.
   *
   * @param {object} user - The user resurce object to create the JWT for.
   * @returns {string} The JWT token.
   */
  #createJwtToken (user) {
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
  #createRefreshToken (user, ipAddress) {
    return new RefreshToken({
      user: user.id,
      token: crypto.randomBytes(40).toString('hex'),
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
      createdByIp: ipAddress
    })
  }

  /**
   * Sets a cookie for the refresh token in response header.
   *
   * @param {object} res - The response object.
   * @param {string} token - The refresh token.
   */
  #setTokenCookie (res, token) {
    const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days.
      sameSite: 'strict'
    }

    res.cookie('refreshToken', token, cookieOptions)
  }
}
