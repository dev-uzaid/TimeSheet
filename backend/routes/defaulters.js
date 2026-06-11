import express from 'express';
import Defaulter from '../models/Defaulter.js';
import Employee from '../models/Employee.js';
import Timesheet from '../models/Timesheet.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Helper to get YYYY-MM-DD strings for Monday through Saturday of a given week
const getWeekDates = (mondayStr) => {
  const dates = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Parse input Monday date (assumed to be in YYYY-MM-DD format in local time)
  const parts = mondayStr.split('-');
  const start = new Date(parts[0], parts[1] - 1, parts[2]);

  for (let i = 0; i < 6; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    
    dates.push({
      dayName: days[i],
      dateStr: `${yyyy}-${mm}-${dd}`
    });
  }
  return dates;
};

// Helper function to calculate current week's Monday string (local date)
const getRecentMondayStr = () => {
  const d = new Date();
  const day = d.getDay();
  // Adjust to Monday: Sunday = 0, Mon = 1, Tue = 2...
  // if Sun (0), subtract 6 days. Else subtract day - 1.
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const mon = new Date(d.setDate(diff));
  
  const yyyy = mon.getFullYear();
  const mm = String(mon.getMonth() + 1).padStart(2, '0');
  const dd = String(mon.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// @desc    Run Defaulter Engine to scan a week
// @route   POST /api/defaulters/run
// @access  Private (Admin only)
router.post('/run', protect, adminOnly, async (req, res) => {
  // Option to pass a custom Monday date YYYY-MM-DD
  const weekStartDate = req.body.weekStartDate || getRecentMondayStr();
  const weekDates = getWeekDates(weekStartDate);

  try {
    // 1. Fetch all staff members (defaulters are tracked for standard employees)
    const staffMembers = await Employee.find({ role: 'staff' });
    
    const logsCreated = [];
    const dateStrings = weekDates.map(wd => wd.dateStr);

    // Clear existing records for this week to avoid duplicates on rerun
    await Defaulter.deleteMany({ weekStartDate });

    for (const staff of staffMembers) {
      // Find timesheets logged by this employee during this week (Mon-Sat)
      const timesheets = await Timesheet.find({
        employeeId: staff._id,
        date: { $in: dateStrings },
        status: { $ne: 'rejected' } // Only count active logs (draft, submitted, approved)
      });

      if (timesheets.length === 0) {
        // Zero entries logged for the entire week
        const record = new Defaulter({
          weekStartDate,
          employeeId: staff._id,
          type: 'zero',
          missingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        });
        await record.save();
        logsCreated.push(record);
      } else {
        // Check day by day to see which ones are missing
        const loggedDates = new Set(timesheets.map(ts => ts.date));
        const missingDays = [];

        for (const wd of weekDates) {
          if (!loggedDates.has(wd.dateStr)) {
            missingDays.push(wd.dayName);
          }
        }

        if (missingDays.length > 0) {
          // Logged some days but missed others
          const record = new Defaulter({
            weekStartDate,
            employeeId: staff._id,
            type: 'partial',
            missingDays
          });
          await record.save();
          logsCreated.push(record);
        }
      }
    }

    res.json({
      message: `Defaulter Engine executed for week starting ${weekStartDate}.`,
      scannedEmployees: staffMembers.length,
      defaultersLogged: logsCreated.length,
      records: logsCreated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get weekly defaulters records
// @route   GET /api/defaulters
// @access  Private (Admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const records = await Defaulter.find({})
      .populate('employeeId', 'name email role managerId')
      .sort({ weekStartDate: -1, createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
