import mongoose from 'mongoose';

export const ACTION_TYPES = [
  'login',
  'create_member',
  'update_member',
  'delete_member',
  'accept_payment',
  'create_admin',
  'create_expense',
  'delete_expense',
  'send_sms',
  'update_profile',
];

/**
 * Audit trail of admin activity — supports multi-admin tracking later.
 */
const actionSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ACTION_TYPES,
      index: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        if (ret.admin && typeof ret.admin === 'object' && ret.admin.toString) {
          ret.admin = ret.admin.toString();
        }
        return ret;
      },
    },
  }
);

actionSchema.index({ createdAt: -1 });
actionSchema.index({ admin: 1, createdAt: -1 });

const Action = mongoose.models.Action || mongoose.model('Action', actionSchema);

export default Action;
