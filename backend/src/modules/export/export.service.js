import Member from '../../models/Member.js';
import Payment from '../../models/Payment.js';
import Expense from '../../models/Expense.js';

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export const exportService = {
  async membersCsv() {
    const members = await Member.find().sort({ createdAt: -1 });
    return toCsv(
      ['code', 'name', 'phone', 'address', 'join', 'plan', 'expiry', 'amount', 'paid'],
      members.map((m) => ({
        code: m.code || '',
        name: m.name,
        phone: m.phone,
        address: m.address,
        join: m.join,
        plan: m.plan,
        expiry: m.expiry,
        amount: m.amount,
        paid: m.paid ? 'yes' : 'no',
      }))
    );
  },

  async paymentsCsv() {
    const payments = await Payment.find().sort({ createdAt: -1 });
    return toCsv(
      [
        'paidAt',
        'memberCode',
        'memberName',
        'phone',
        'plan',
        'amount',
        'method',
        'adminName',
        'note',
      ],
      payments.map((p) => ({
        paidAt: p.paidAt,
        memberCode: p.memberCode || '',
        memberName: p.memberName,
        phone: p.phone,
        plan: p.plan,
        amount: p.amount,
        method: p.method,
        adminName: p.adminName,
        note: p.note || '',
      }))
    );
  },

  async expensesCsv() {
    const expenses = await Expense.find().sort({ date: -1 });
    return toCsv(
      ['date', 'title', 'category', 'amount', 'adminName', 'note'],
      expenses.map((e) => ({
        date: e.date,
        title: e.title,
        category: e.category,
        amount: e.amount,
        adminName: e.adminName,
        note: e.note || '',
      }))
    );
  },
};
