/**
 * Module for the AccountController.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken'
import createError from 'http-errors'
import { User } from '../../models/user.js'

/**
 * Encapsulates a controller.
 */
export class AccountController {
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

      const payload = {
        sub: user.id,
        preferred_username: user.username,
        given_name: user.givenName,
        family_name: user.familyName,
        email: user.email
      }

      const privateKey = Buffer.from(process.env.PRIVATE_KEY, 'base64')

      // Create access token.
      const accessToken = jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
        expiresIn: process.env.ACCESS_TOKEN_LIFE
      })

      res
        .json({
          access_token: accessToken
        })
    } catch (error) {
      // Authentication failed.
      const err = createError(401)
      err.cause = error

      next(err)
    }
  }

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
}
