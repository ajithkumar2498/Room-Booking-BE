import { generateUtilizationReport } from '../services/BookingService.js';

export const getReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
        return res.status(400).json({ error: "Missing 'from' or 'to' parameters" });
    }
    const report = await generateUtilizationReport(from, to);
    res.json(report);
  } catch (err) {
    next(err);
  }
};