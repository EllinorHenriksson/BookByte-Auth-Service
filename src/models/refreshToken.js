/**
 * Mongoose RefreshToken model.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import mongoose from 'mongoose'

const Schema = mongoose.Schema

// Create a schema.
const schema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  token: {
    type: String,
    unique: true
  },
  expires: Date,
  created: { type: Date, default: Date.now },
  createdByIp: String,
  revoked: Date,
  revokedByIp: String,
  replacedByToken: String
}, {
  timestamps: true,
  toObject: {
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
    },
    virtuals: true // ensure virtual fields are serialized
  }
})

schema.virtual('id').get(function () {
  return this._id.toHexString()
})

schema.virtual('isExpired').get(function () {
  return Date.now() >= this.expires
})

schema.virtual('isActive').get(function () {
  return !this.revoked && !this.isExpired
})

// Create a model using the schema.
export const RefreshToken = mongoose.model('RefreshToken', schema)
