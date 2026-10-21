import { exportService } from './export.service.js';

function sendCsv(res, filename, csv) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // BOM helps Excel open UTF-8 Bangla correctly
  res.send(`\uFEFF${csv}`);
}

export const exportController = {
  async members(req, res) {
    const csv = await exportService.membersCsv();
    sendCsv(res, 'sa-gym-members.csv', csv);
  },
  async payments(req, res) {
    const csv = await exportService.paymentsCsv();
    sendCsv(res, 'sa-gym-payments.csv', csv);
  },
  async expenses(req, res) {
    const csv = await exportService.expensesCsv();
    sendCsv(res, 'sa-gym-expenses.csv', csv);
  },
};
