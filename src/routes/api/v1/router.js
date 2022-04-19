/**
 * API version 1 routes.
 *
 * @author Ellinor Henriksson
 * @version 2.0.0
 */

import express from 'express'
import { router as authRouter } from './auth-router.js'

export const router = express.Router()

router.use('/auth', authRouter)
