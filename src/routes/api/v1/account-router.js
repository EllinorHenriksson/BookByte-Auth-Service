/**
 * Account routes.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import express from 'express'
import { AccountController } from '../../../controllers/api/account-controller.js'

export const router = express.Router()

const controller = new AccountController()

// --- Routes ---
router.post('/register', (req, res, next) => controller.register(req, res, next))

router.post('/login', (req, res, next) => controller.login(req, res, next))

router.get('/refresh-token', (req, res, next) => controller.refreshToken(req, res, next))
