/**
 * The starting point of the application.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import logger from 'morgan'
import { router } from './routes/router.js'
import { connectDB } from './config/mongoose.js'

try {
  await connectDB()

  const app = express()

  app.use(helmet())

  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
    next()
  })

  app.use(logger('dev'))

  app.use(express.json())

  app.use(cookieParser())

  if (app.get('env') === 'production') {
    app.set('trust proxy', 1)
  }

  app.use('/', router)

  app.use(function (err, req, res, next) {
    err.status = err.status || 500

    if (req.app.get('env') !== 'development') {
      if (err.status === 500) {
        err.message = 'An unexpected condition was encountered'
      }
      return res
        .status(err.status)
        .json({
          status: err.status,
          message: err.message
        })
    }

    // Development only!
    return res
      .status(err.status)
      .json({
        status: err.status,
        message: err.message,
        cause: err.cause
          ? {
              status: err.cause.status,
              message: err.cause.message,
              stack: err.cause.stack
            }
          : null,
        stack: err.stack
      })
  })

  app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`)
    console.log('Press Ctrl-C to terminate...')
  })
} catch (err) {
  console.error(err)
  process.exitCode = 1
}
