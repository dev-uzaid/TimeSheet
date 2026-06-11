import express from 'express';
import DefaulterRecord from '../models/DefaulterRecord.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { runWeeklyAuditCheck } from '../services/defaulterCron.js';

const router = express.Router();

// @desc    Run Defaulter Engine to scan a week
// @route   POST /api/defaulters/run
// @access  Private (Admin only)
router.post('/run', protect, adminOnly, async (req, res) => {
  const { weekStartDate } = req.body;
  try {
    const result = await runWeeklyAuditCheck(weekStartDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get weekly defaulters records (with search & filtering)
// @route   GET /api/defaulters
// @access  Private (Admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { weekStartDate, defaulterType, search } = req.query;
    const query = {};

    if (weekStartDate) {
      query.weekStartDate = weekStartDate;
    }
    if (defaulterType) {
      query.defaulterType = defaulterType;
    }
    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { manager: { $regex: search, $options: 'i' } }
      ];
    }

    const records = await DefaulterRecord.find(query)
      .sort({ weekStartDate: -1, createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete/Clear a defaulter record
// @route   DELETE /api/defaulters/:id
// @access  Private (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const record = await DefaulterRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Defaulter record not found' });
    }
    res.json({ message: 'Defaulter record cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
