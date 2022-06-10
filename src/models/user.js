/**
 * Mongoose model User.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import validator from 'validator'
import createError from 'http-errors'

const { isEmail } = validator

// Create a schema.
const schema = new mongoose.Schema({
  givenName: {
    type: String,
    required: [true, 'Given name is required.'],
    trim: true
  },
  familyName: {
    type: String,
    required: [true, 'Family name is required.'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email address is required.'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [isEmail, 'Email address is not valid.']
  },
  username: {
    type: String,
    required: [true, 'Username is required.'],
    unique: true,
    // - A valid username should start with an alphabet so, [A-Za-z].
    // - All other characters can be alphabets, numbers or an underscore so, [A-Za-z0-9_-].
    // - Since length constraint is 3-256 and we had already fixed the first character, so we give {2, 255}.
    // - We use ^ and $ to specify the beginning and end of matching.
    match: [/^[A-Za-z][A-Za-z0-9_-]{2,255}$/, 'Username must be longer/shorter than 3/256 characters, only contain alphabets, numbers or underscores and start with an alphabeth).']
  },
  password: {
    type: String,
    minLength: [10, 'Password must be at least 10 characters long.'],
    maxLength: [256, 'Password must not be longer than 256 characters.'],
    required: [true, 'Password is required.']
  }
}, {
  timestamps: true,
  toJSON: {
    /**
     * Performs a transformation of the resulting object to remove sensitive information.
     *
     * @param {object} doc - The mongoose document which is being converted.
     * @param {object} ret - The plain object representation which has been converted.
     */
    transform: function (doc, ret) {
      delete ret._id
      delete ret.__v
      delete ret.createdAt
      delete ret.updatedAt
      delete ret.password
    },
    virtuals: true // ensure virtual fields are serialized
  }
})

schema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Salts and hashes password before save.
schema.pre('save', async function () {
  this.password = await bcrypt.hash(this.password, 10)
})

/**
 * Authenticates a user.
 *
 * @param {string} username - ...
 * @param {string} password - ...
 * @returns {Promise<User>} ...
 */
schema.statics.authenticate = async function (username, password) {
  const user = await this.findOne({ username })

  // If no user found or password is wrong, throw an error.
  if (!(await bcrypt.compare(password, user?.password))) {
    throw new Error('Invalid credentials')
  }

  // User found and password correct, return the user.
  return user
}

/**
 * Checks if password is correct for user.
 *
 * @param {User} user - The user object.
 * @param {string} password - ...
 */
schema.statics.checkPassword = async function (user, password) {
  // If no user found or password is wrong, throw an error.
  if (!(await bcrypt.compare(password, user.password))) {
    throw createError(401, 'Wrong password.')
  }
}

// Create a model using the schema.
export const User = mongoose.model('User', schema)
