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
