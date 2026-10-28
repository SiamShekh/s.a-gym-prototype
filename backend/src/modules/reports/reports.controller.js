import { reportsService } from './reports.service.js';

export const reportsController = {
  async overview(req, res) {
    const { from, to, scope } = req.query;
    const report = await reportsService.overview({ from, to, scope });
    res.json({ success: true, report });
  },
};
