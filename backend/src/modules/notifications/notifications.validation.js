import * as yup from 'yup';
import { SMS_BUCKETS } from '../../models/SmsLog.js';

export const sendSmsSchema = yup.object({
  memberIds: yup.array().of(yup.string().trim()).optional(),
  buckets: yup
    .array()
    .of(yup.string().oneOf(SMS_BUCKETS))
    .optional(),
});
