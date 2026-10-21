import mongoose from 'mongoose';
import { SMS_BUCKETS } from '../utils/smsMessage.js';

const smsLogSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    memberName: { type: String, default: '', trim: true },
    memberCode: { type: String, default: '', trim: true },
    phone: { type: String, required: true, trim: true },
    bucket: {
      type: String,
      required: true,
      index: true,
    },
    /** Member expiry date at send-time — used for one-SMS-per-stage-per-cycle */
    memberExpiry: {
      type: String,
      default: '',
      index: true,
    },
    message: { type: String, required: true },
    charCount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['sent', 'skipped_duplicate', 'skipped_cap', 'skipped_opt_out', 'failed', 'dry_run'],
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['cron', 'manual', 'system'],
      default: 'cron',
      index: true,
    },
    providerRef: { type: String, default: '' },
    error: { type: String, default: '' },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    adminName: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        if (ret.member?.toString) ret.member = ret.member.toString();
        if (ret.admin?.toString) ret.admin = ret.admin.toString();
        return ret;
      },
    },
  }
);

smsLogSchema.index({ member: 1, bucket: 1, memberExpiry: 1, status: 1 });
smsLogSchema.index({ createdAt: -1 });
smsLogSchema.index({ phone: 1, createdAt: -1 });

const SmsLog = mongoose.models.SmsLog || mongoose.model('SmsLog', smsLogSchema);

export { SMS_BUCKETS };
export default SmsLog;
