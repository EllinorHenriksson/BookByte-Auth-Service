/**
 * User routes.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import createError from 'http-errors'
import express from 'express'
import jwt from 'jsonwebtoken'
import { UserController } from '../../../controllers/api/user-controller.js'

export const router = express.Router()

const controller = new UserController()

/**
 * Authenticates requests.
 *
 * If authentication is successful, `req.authenticatedUserId`is populated and the
 * request is authorized to continue.
 * If authentication fails, an unauthorized response will be sent.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const authenticateJWT = (req, res, next) => {
  try {
    const [authenticationScheme, token] = req.headers.authorization?.split(' ')

    if (authenticationScheme !== 'Bearer') {
      throw new Error('Invalid authentication scheme.')
    }

    const publicKey = Buffer.from(process.env.PUBLIC_KEY, 'base64')

    const payload = jwt.verify(token, publicKey)

    req.authenticatedUserId = payload.sub

    next()
  } catch (err) {
    const error = createError(401, 'Access token invalid or not provided.')
    error.cause = err
    next(error)
  }
}

/**
 * Authorize requests.
 *
 * If authorization is successful, that is the user is granted access
 * to the requested resource, the request is authorized to continue.
 * If authentication fails, a forbidden response will be sent.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const hasPermission = (req, res, next) => {
  if (req.authenticatedUserId === req.requestedUser.id) {
    next()
  } else {
    next(createError(403, 'Permission to the requested resource was denied.'))
  }
}

// Provide req.requestedUser to the route if :id is present in the route path.
router.param('id', (req, res, next, id) => controller.loadRequestedUser(req, res, next, id))

// --- Routes ---
router.get('/:id',
  authenticateJWT,
  (req, res, next) => controller.find(req, res, next)
)

router.patch('/:id',
  authenticateJWT,
  hasPermission,
  (req, res, next) => controller.partialUpdate(req, res, next)
)

router.put('/:id',
  authenticateJWT,
  hasPermission,
  (req, res, next) => controller.fullUpdate(req, res, next)
)

router.delete('/:id',
  authenticateJWT,
  hasPermission,
  (req, res, next) => controller.delete(req, res, next)
)
