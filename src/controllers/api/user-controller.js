/**
 * Module for the UserController.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import createError from 'http-errors'
import { User } from '../../models/user.js'
import * as helper from '../../helper-modules/controller-helper.js'
import { RefreshToken } from '../../models/refreshToken.js'
/**
 * Encapsulates a controller.
 */
export class UserController {
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
        err = createError(409, 'Username and/or email address already registered')
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

      // Create JWT.
      const jwtToken = helper.createJwt(user)

      // Create refresh token.
      const refreshToken = helper.createRefreshToken(user, req.ip)
      await refreshToken.save()

      // Set cookie with refresh token.
      helper.setTokenCookie(res, refreshToken.token)

      res
        .json({
          jwt: jwtToken,
          user_data: user
        })
    } catch (error) {
      // Authentication failed.
      const err = createError(401, 'Credentials invalid or not provided')
      err.cause = error

      next(err)
    }
  }

  /**
   * Creates a new refresh token (and JWT).
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async refresh (req, res, next) {
    try {
      // Check and retrieve refresh token.
      const refreshToken = await helper.getRefreshToken(req.cookies.refreshToken)

      const user = refreshToken.user

      // Create new refresh token and save it.
      const newRefreshToken = helper.createRefreshToken(user, req.ip)
      await newRefreshToken.save()

      // Update old refresh token and save it.
      refreshToken.revoked = Date.now()
      refreshToken.revokedByIp = req.ip
      refreshToken.replacedByToken = newRefreshToken.token
      await refreshToken.save()

      const jwtToken = helper.createJwt(user)

      // Set cookie with refresh token.
      helper.setTokenCookie(res, newRefreshToken.token)

      res
        .json({
          jwt: jwtToken,
          user_data: user
        })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Revokes the refresh token so that the user logs out when the JWT expires.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async logout (req, res, next) {
    try {
      // Check and retrieve refresh token.
      const refreshToken = await helper.getRefreshToken(req.cookies.refreshToken)

      if (refreshToken.user.id !== req.authenticatedUser.id) {
        return next(createError(401, 'Refresh token invalid or not provided'))
      }

      // Revoke token and save it.
      refreshToken.revoked = Date.now()
      refreshToken.revokedByIp = req.ip
      await refreshToken.save()

      res.json({ message: 'Refresh token revoked' })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sends the user's account data back to the user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async account (req, res, next) {
    res.json(req.authenticatedUser)
  }

  /**
   * Partially updates the user info.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async partialUpdate (req, res, next) {
    try {
      if (!req.body.username && !req.body.givenName && !req.body.familyName && !req.body.email && !req.body.password) {
        next(createError(400, 'None of the requested data was provided'))
      } else {
        const update = {}

        if (req.body.username) {
          update.username = req.body.username
        }
        if (req.body.givenName) {
          update.givenName = req.body.givenName
        }
        if (req.body.familyName) {
          update.familyName = req.body.familyName
        }
        if (req.body.email) {
          update.email = req.body.email
        }

        if (Object.keys(update).length > 0) {
          await req.authenticatedUser.updateOne(update, { runValidators: true })
        }

        if (req.body.password) {
          req.authenticatedUser.password = req.body.password
          await req.authenticatedUser.save()
        }
        res.status(204).end()
      }
    } catch (error) {
      let err = error

      if (err.code === 11000) {
        // Duplicated keys.
        err = createError(409, 'Username and/or email already registered')
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
   * Fully updates the user info.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async fullUpdate (req, res, next) {
    try {
      req.authenticatedUser.username = req.body.username
      req.authenticatedUser.givenName = req.body.givenName
      req.authenticatedUser.familyName = req.body.familyName
      req.authenticatedUser.email = req.body.email
      req.authenticatedUser.password = req.body.password

      await req.authenticatedUser.save()
      res.status(204).end()
    } catch (error) {
      let err = error

      if (err.code === 11000) {
        // Duplicated keys.
        err = createError(409, 'Username and/or email already registered.')
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
   * Removes a user from the Users collection.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async delete (req, res, next) {
    try {
      await RefreshToken.deleteMany({ user: req.authenticatedUser._id })
      await req.authenticatedUser.remove()
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sends data for a specific user to the client.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  findOne (req, res, next) {
    res.json(req.requestedUser)
  }
}
