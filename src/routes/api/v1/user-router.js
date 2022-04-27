/**
 * User routes.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import express from 'express'
import { UserController } from '../../../controllers/api/user-controller.js'
import * as helper from '../../../helper-modules/router-helper.js'

export const router = express.Router()

const controller = new UserController()

// Provide req.requestedUser to the route if :id is present in the route path.
router.param('id', (req, res, next, id) => helper.loadRequestedUser(req, res, next, id))

// --- Routes ---
router.post('/register', (req, res, next) => controller.register(req, res, next))

router.post('/login', (req, res, next) => controller.login(req, res, next))

router.get('/refresh', (req, res, next) => controller.refresh(req, res, next))

router.get('/logout',
  helper.authenticateJWT,
  (req, res, next) => controller.logout(req, res, next)
)

router.get('/account',
  helper.authenticateJWT,
  (req, res, next) => controller.account(req, res, next)
)

router.patch('/account',
  helper.authenticateJWT,
  (req, res, next) => controller.partialUpdate(req, res, next)
)

router.put('/account',
  helper.authenticateJWT,
  (req, res, next) => controller.fullUpdate(req, res, next)
)

router.delete('/account',
  helper.authenticateJWT,
  (req, res, next) => controller.delete(req, res, next)
)

router.get('/:id',
  helper.authenticateJWT,
  (req, res, next) => controller.findOne(req, res, next)
)
