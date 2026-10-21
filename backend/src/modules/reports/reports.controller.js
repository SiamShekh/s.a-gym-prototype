import { reportsService } from './reports.service.js';

export const reportsController = {
  async overview(req, res) {
    const report = await reportsService.overview();
    res.json({ success: true, report });
  },
};
