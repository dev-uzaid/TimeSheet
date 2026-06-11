import cron from 'node-cron';
import Employee from '../models/Employee.js';
import Timesheet from '../models/Timesheet.js';
import DefaulterRecord from '../models/DefaulterRecord.js';

// Helper to get Monday date string of target week
export const getRecentMondayStr = (referenceDate = new Date()) => {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const mon = new Date(d.setDate(diff));
  
  const yyyy = mon.getFullYear();
  const mm = String(mon.getMonth() + 1).padStart(2, '0');
  const dd = String(mon.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Helper to get dates Monday-Saturday of target week
export const getWeekDates = (mondayStr) => {
  const dates = [];
  const parts = mondayStr.split('-');
  const start = new Date(parts[0], parts[1] - 1, parts[2]);

  for (let i = 0; i < 6; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
};

// Core auditing check
export const runWeeklyAuditCheck = async (weekStartDate) => {
  const targetWeekStart = weekStartDate || getRecentMondayStr();
  const targetWeekDates = getWeekDates(targetWeekStart);

  const staffMembers = await Employee.find({ role: 'staff' })
    .populate('company')
    .populate('managerId');
    
  const logsCreated = [];

  // Prevent duplicate reports for the same week by deleting first
  await DefaulterRecord.deleteMany({ weekStartDate: targetWeekStart });

  for (const staff of staffMembers) {
    const timesheets = await Timesheet.find({
      employeeId: staff._id,
      date: { $in: targetWeekDates },
      status: { $ne: 'rejected' }
    });

    const loggedDates = new Set(timesheets.map(t => t.date));
    const missingDates = targetWeekDates.filter(date => !loggedDates.has(date));

    if (missingDates.length === 6) {
      // Zero entries logged
      const record = new DefaulterRecord({
        weekStartDate: targetWeekStart,
        employeeId: staff._id,
        employeeName: staff.name,
        email: staff.email,
        department: staff.company?.companyName || 'General',
        manager: staff.managerId?.name || 'N/A',
        defaulterType: 'Zero Entries',
        missingDates
      });
      await record.save();
      logsCreated.push(record);
    } else if (missingDates.length > 0) {
      // Partial entries missing
      const record = new DefaulterRecord({
        weekStartDate: targetWeekStart,
        employeeId: staff._id,
        employeeName: staff.name,
        email: staff.email,
        department: staff.company?.companyName || 'General',
        manager: staff.managerId?.name || 'N/A',
        defaulterType: 'Partial Entries',
        missingDates
      });
      await record.save();
      logsCreated.push(record);
    }
  }

  return {
    weekStartDate: targetWeekStart,
    scannedEmployees: staffMembers.length,
    defaultersLogged: logsCreated.length,
    records: logsCreated
  };
};

// Start Saturday cron check at 23:59 PM (11:59 PM) every Saturday
export const initDefaulterCron = () => {
  cron.schedule('59 23 * * 6', async () => {
    console.log(`[Cron Task] Running weekly defaulter audit compliance check on Saturday at ${new Date().toISOString()}`);
    try {
      const result = await runWeeklyAuditCheck();
      console.log(`[Cron Task] Successfully audited. Scanned: ${result.scannedEmployees}, Flagged: ${result.defaultersLogged} defaulters.`);
    } catch (error) {
      console.error(`[Cron Task Error] Defaulter audit check failed:`, error);
    }
  });
};
