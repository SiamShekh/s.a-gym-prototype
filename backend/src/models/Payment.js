import mongoose from 'mongoose';
import { PLAN_CODES } from '../utils/plans.js';

const paymentSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    memberName: { type: String, required: true, trim: true },
    memberCode: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    plan: {
      type: String,
      required: true,
      enum: PLAN_CODES,
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['bkash', 'nagad', 'rocket', 'cash'],
      default: 'cash',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    adminName: { type: String, required: true, trim: true },
    paidAt: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    note: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        if (ret.member && typeof ret.member === 'object' && ret.member.toString) {
          ret.member = ret.member.toString();
        }
        if (ret.admin && typeof ret.admin === 'object' && ret.admin.toString) {
          ret.admin = ret.admin.toString();
        }
        return ret;
      },
    },
  }
);

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ paidAt: -1 });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
