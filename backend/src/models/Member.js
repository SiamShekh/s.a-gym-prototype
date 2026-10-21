import mongoose from 'mongoose';
import { PLAN_CODES } from '../utils/plans.js';

/**
 * Gym member — fields match Android Member form + list/billing usage:
 * form: name, phone, address, join, plan
 * derived/stored: expiry, amount
 * billing/overview: paid
 */
const memberSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    join: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    plan: {
      type: String,
      required: true,
      enum: PLAN_CODES,
    },
    expiry: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paid: {
      type: Boolean,
      default: true,
    },
    smsOptOut: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

memberSchema.index({ phone: 1 });
memberSchema.index({ name: 1 });
memberSchema.index({ expiry: 1 });

const Member = mongoose.models.Member || mongoose.model('Member', memberSchema);

export default Member;
