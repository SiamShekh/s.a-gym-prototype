import mongoose from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'rent',
  'salary',
  'utilities',
  'equipment',
  'maintenance',
  'other',
];

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      default: 'other',
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    note: { type: String, trim: true, default: '' },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    adminName: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
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

expenseSchema.index({ createdAt: -1 });

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

export default Expense;
