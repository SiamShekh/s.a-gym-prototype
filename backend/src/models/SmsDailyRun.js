import mongoose from 'mongoose';

/** One manual SMS blast per Asia/Dhaka calendar day. */
const smsDailyRunSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true, unique: true },
    adminName: { type: String, default: '' },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const SmsDailyRun = mongoose.models.SmsDailyRun || mongoose.model('SmsDailyRun', smsDailyRunSchema);

export default SmsDailyRun;
