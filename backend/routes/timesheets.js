import express from 'express';
import Timesheet from '../models/Timesheet.js';
import TimesheetQuery from '../models/TimesheetQuery.js';
import Engagement from '../models/Engagement.js';
import Employee from '../models/Employee.js';
import Notification from '../models/Notification.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get timesheet entries
// @route   GET /api/timesheets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'staff') {
      query.employeeId = req.user._id;
    } else {
      // Managers and Admins can view all, or filter by specific employee
      if (req.query.employeeId) {
        query.employeeId = req.query.employeeId;
      }
      // Managers might only want to see people who report to them by default
      if (req.query.pendingOnly === 'true') {
        query.status = { $in: ['submitted', 'queried'] };
        
        // If manager, default to filtering by their subordinates unless admin
        if (req.user.role === 'manager' && !req.query.allEmployees) {
          const subordinates = await Employee.find({ managerId: req.user._id }).select('_id');
          const subIds = subordinates.map(s => s._id);
          query.employeeId = { $in: subIds };
        }
      }
    }

    if (req.query.startDate && req.query.endDate) {
      query.date = { $gte: req.query.startDate, $lte: req.query.endDate };
    }

    const timesheets = await Timesheet.find(query)
      .populate('engagementId', 'name clientId status')
      .populate('employeeId', 'name email role')
      .sort({ date: -1, createdAt: -1 });

    res.json(timesheets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a single timesheet entry
// @route   POST /api/timesheets
// @access  Private
router.post('/', protect, async (req, res) => {
  const { engagementId, workType, date, hours, markedDone } = req.body;

  try {
    // Check if engagement is completed/billed (staff shouldn't log to it)
    const engagement = await Engagement.findById(engagementId);
    if (!engagement) {
      return res.status(404).json({ message: 'Engagement not found' });
    }

    if (engagement.status === 'completed' || engagement.status === 'billed') {
      return res.status(400).json({ message: 'Cannot log hours for completed/billed engagements' });
    }

    // Managers and Admins entries are auto-approved directly to approved
    const status = (req.user.role === 'manager' || req.user.role === 'admin') ? 'approved' : 'draft';

    const timesheet = new Timesheet({
      employeeId: req.user._id,
      engagementId,
      workType,
      date,
      hours,
      status,
      markedDone: markedDone || false
    });

    const createdTimesheet = await timesheet.save();

    // If markedDone is toggled, transition engagement status to review_pending
    if (markedDone) {
      engagement.status = 'review_pending';
      await engagement.save();

      // Trigger notification alert to manager
      const managerId = req.user.managerId;
      if (managerId) {
        await Notification.create({
          recipientId: managerId,
          title: 'Engagement Ready for Audit',
          body: `${req.user.name} logged final hours and marked engagement "${engagement.name}" as ready for quality audit.`
        });
      }
    }

    const populated = await Timesheet.findById(createdTimesheet._id)
      .populate('engagementId', 'name clientId status')
      .populate('employeeId', 'name email role');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Daily Bulk Entry grid submit
// @route   POST /api/timesheets/bulk
// @access  Private
router.post('/bulk', protect, async (req, res) => {
  const { date, entries } = req.body; // entries: Array of { engagementId, workType, hours, markedDone }

  try {
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'No entries provided' });
    }

    const savedEntries = [];
    const isAutoApproved = (req.user.role === 'manager' || req.user.role === 'admin');
    const status = isAutoApproved ? 'approved' : 'draft';

    for (const entry of entries) {
      const { engagementId, workType, hours, markedDone } = entry;
      
      const engagement = await Engagement.findById(engagementId);
      if (!engagement || engagement.status === 'completed' || engagement.status === 'billed') {
        continue; // skip invalid or closed projects
      }

      // Check if entry for employee, date, engagement, workType already exists as draft/rejected
      // If it exists, we aggregate or overwrite (let's overwrite hours/details)
      let timesheet = await Timesheet.findOne({
        employeeId: req.user._id,
        engagementId,
        workType,
        date,
        status: { $in: ['draft', 'rejected', 'queried'] }
      });

      if (timesheet) {
        timesheet.hours = hours;
        timesheet.markedDone = markedDone || false;
        timesheet.status = status; // resets rejected to draft/approved
      } else {
        timesheet = new Timesheet({
          employeeId: req.user._id,
          engagementId,
          workType,
          date,
          hours,
          status,
          markedDone: markedDone || false
        });
      }

      const saved = await timesheet.save();
      savedEntries.push(saved);

      if (markedDone) {
        engagement.status = 'review_pending';
        await engagement.save();

        const managerId = req.user.managerId;
        if (managerId) {
          await Notification.create({
            recipientId: managerId,
            title: 'Engagement Ready for Audit',
            body: `${req.user.name} logged final hours and marked engagement "${engagement.name}" as ready for quality audit.`
          });
        }
      }
    }

    res.status(201).json({ message: `${savedEntries.length} entries processed`, entries: savedEntries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Submit all drafts
// @route   PUT /api/timesheets/submit-drafts
// @access  Private
router.put('/submit-drafts', protect, async (req, res) => {
  try {
    const drafts = await Timesheet.find({
      employeeId: req.user._id,
      status: 'draft'
    });

    if (drafts.length === 0) {
      return res.status(400).json({ message: 'No draft timesheets found to submit' });
    }

    // Update status to submitted
    await Timesheet.updateMany(
      { employeeId: req.user._id, status: 'draft' },
      { $set: { status: 'submitted' } }
    );

    // Notify Reporting Manager
    if (req.user.managerId) {
      await Notification.create({
        recipientId: req.user.managerId,
        title: 'Timesheets Submitted for Approval',
        body: `Staff member ${req.user.name} has submitted ${drafts.length} timesheet entries for approval.`
      });
    } else {
      // If no manager, notify all managers/admins
      const supervisors = await Employee.find({ role: { $in: ['manager', 'admin'] } });
      for (const supervisor of supervisors) {
        await Notification.create({
          recipientId: supervisor._id,
          title: 'Timesheets Submitted for Approval',
          body: `Staff member ${req.user.name} has submitted ${drafts.length} timesheet entries for approval.`
        });
      }
    }

    res.json({ message: `${drafts.length} timesheet entries submitted successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve timesheet entry
// @route   PUT /api/timesheets/:id/approve
// @access  Private (Manager/Admin only)
router.put('/:id/approve', protect, managerOrAdmin, async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    timesheet.status = 'approved';
    timesheet.rejectionComment = '';
    await timesheet.save();

    res.json({ message: 'Timesheet approved successfully', timesheet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reject timesheet entry (Requires comment)
// @route   PUT /api/timesheets/:id/reject
// @access  Private (Manager/Admin only)
router.put('/:id/reject', protect, managerOrAdmin, async (req, res) => {
  const { rejectionComment } = req.body;

  if (!rejectionComment) {
    return res.status(400).json({ message: 'Rejection comment is required' });
  }

  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    timesheet.status = 'rejected';
    timesheet.rejectionComment = rejectionComment;
    await timesheet.save();

    // Trigger Timesheet Query conversation thread
    const initialQuery = await TimesheetQuery.create({
      timesheetId: timesheet._id,
      senderId: req.user._id,
      message: `System Alert: Timesheet rejected by ${req.user.name} with comment: "${rejectionComment}"`
    });

    // Notify Employee
    await Notification.create({
      recipientId: timesheet.employeeId,
      title: 'Timesheet Entry Rejected',
      body: `Your timesheet entry for date ${timesheet.date} was rejected by ${req.user.name}. Reason: ${rejectionComment}`
    });

    res.json({ message: 'Timesheet rejected successfully', timesheet, query: initialQuery });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Raise query on timesheet entry (Requires comment)
// @route   PUT /api/timesheets/:id/query
// @access  Private (Manager/Admin only)
router.put('/:id/query', protect, managerOrAdmin, async (req, res) => {
  const { queryComment } = req.body;

  if (!queryComment) {
    return res.status(400).json({ message: 'Query comment is required' });
  }

  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    timesheet.status = 'queried';
    timesheet.rejectionComment = queryComment;
    await timesheet.save();

    // Trigger Timesheet Query conversation thread
    const initialQuery = await TimesheetQuery.create({
      timesheetId: timesheet._id,
      senderId: req.user._id,
      message: `System Alert: Query raised by ${req.user.name} with comment: "${queryComment}"`
    });

    // Notify Employee
    await Notification.create({
      recipientId: timesheet.employeeId,
      title: 'Query Raised on Timesheet Entry',
      body: `A query was raised on your timesheet entry for date ${timesheet.date} by ${req.user.name}. Reason: ${queryComment}`
    });

    res.json({ message: 'Query raised successfully', timesheet, query: initialQuery });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get queries for a timesheet
// @route   GET /api/timesheets/:id/queries
// @access  Private
router.get('/:id/queries', protect, async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Verify ownership
    if (req.user.role === 'staff' && timesheet.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const queries = await TimesheetQuery.find({ timesheetId: req.params.id })
      .populate('senderId', 'name email role')
      .sort({ createdAt: 1 });

    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create query message (Chat back and forth)
// @route   POST /api/timesheets/:id/queries
// @access  Private
router.post('/:id/queries', protect, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message content is required' });
  }

  try {
    const timesheet = await Timesheet.findById(req.params.id);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Verify ownership
    if (req.user.role === 'staff' && timesheet.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const query = await TimesheetQuery.create({
      timesheetId: timesheet._id,
      senderId: req.user._id,
      message
    });

    const populatedQuery = await TimesheetQuery.findById(query._id)
      .populate('senderId', 'name email role');

    // Notify other party
    let recipientId;
    if (req.user.role === 'staff') {
      // Find staff's manager to notify
      const staffUser = await Employee.findById(timesheet.employeeId);
      recipientId = staffUser.managerId;
      if (!recipientId) {
        // Fallback to finding the person who rejected the timesheet
        const lastRejection = await TimesheetQuery.findOne({ timesheetId: timesheet._id }).sort({ createdAt: 1 });
        recipientId = lastRejection ? lastRejection.senderId : null;
      }
    } else {
      recipientId = timesheet.employeeId;
    }

    if (recipientId) {
      await Notification.create({
        recipientId,
        title: 'New Message on Timesheet Query',
        body: `${req.user.name}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
      });
    }

    res.status(201).json(populatedQuery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a timesheet entry (rework)
// @route   PUT /api/timesheets/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { hours, workType, engagementId, markedDone } = req.body;

  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Only creator can update
    if (timesheet.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this timesheet' });
    }

    // Only allow edit if draft, rejected, or queried
    if (timesheet.status !== 'draft' && timesheet.status !== 'rejected' && timesheet.status !== 'queried') {
      return res.status(400).json({ message: 'Cannot edit a submitted or approved timesheet' });
    }

    timesheet.hours = hours !== undefined ? hours : timesheet.hours;
    timesheet.workType = workType || timesheet.workType;
    timesheet.engagementId = engagementId || timesheet.engagementId;
    if (markedDone !== undefined) timesheet.markedDone = markedDone;

    // Reset status to draft so they can resubmit it
    timesheet.status = 'draft';
    const updated = await timesheet.save();

    const populated = await Timesheet.findById(updated._id)
      .populate('engagementId', 'name clientId status')
      .populate('employeeId', 'name email role');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
