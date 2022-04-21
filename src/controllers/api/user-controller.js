/**
 * Module for the UserController.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import createError from 'http-errors'
import { User } from '../../models/user.js'

/**
* Encapsulates a controller.
*/
export class UserController {
  /**
   * Loads the requested user to the request object.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @param {string} id - The id of the user to load.
   */
  async loadRequestedUser (req, res, next, id) {
    try {
      req.requestedUser = await User.findById(id)
      next()
    } catch (error) {
      next(createError(404, 'The requested resource was not found.'))
    }
  }

  /**
   * Sends data for a specific user to the client.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  find (req, res, next) {
    res.json(req.requestedUser)
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
        next(createError(400, 'None of the requested data was provided.'))
      } else if (req.body.password && (req.body.password !== req.body.passwordRepeat)) {
        next(createError(400, 'The new password was not repeated correctly.'))
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
          await req.requestedUser.updateOne(update, { runValidators: true })
        }

        if (req.body.password) {
          req.requestedUser.password = req.body.password
          await req.requestedUser.save()
        }
        res.status(204).end()
      }
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
   * Fully updates the user info.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async fullUpdate (req, res, next) {
    try {
      if (req.body.password !== req.body.passwordRepeat) {
        next(createError(400, 'The new password was not repeated correctly.'))
      } else {
        req.requestedUser.username = req.body.username
        req.requestedUser.givenName = req.body.givenName
        req.requestedUser.familyName = req.body.familyName
        req.requestedUser.email = req.body.email
        req.requestedUser.password = req.body.password

        await req.requestedUser.save()
        res.status(204).end()
      }
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
      await req.requestedUser.remove()
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
}
