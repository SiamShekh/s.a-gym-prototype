import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Gym admin / owner — login matches Android LoginActivity (phone + password).
 * Multiple admins can exist in the same collection.
 */
const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['owner', 'staff'],
      default: 'owner',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

adminSchema.pre('save', async function beforeSave() {
  if (this.isModified('phone')) {
    this.phone = String(this.phone).replace(/[\s-]/g, '').trim();
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

adminSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default Admin;
