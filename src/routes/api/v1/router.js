/**
 * API version 1 routes.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import express from 'express'
import { router as userRouter } from './user-router.js'

export const router = express.Router()

router.use('/users', userRouter)
