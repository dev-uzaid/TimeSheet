import express from 'express';
import Engagement from '../models/Engagement.js';
import Notification from '../models/Notification.js';
import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get engagements (filtered by role and assignment)
// @route   GET /api/engagements
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let engagements;

    if (req.user.role === 'staff') {
      // Staff only sees active engagements they are assigned to
      engagements = await Engagement.find({
        assignedStaff: req.user._id,
        status: { $in: ['unassigned', 'work_in_progress', 'review_pending'] }
      }).populate('clientId', 'name industry');
    } else {
      // Managers and Admins see all
      engagements = await Engagement.find({})
        .populate('clientId', 'name industry')
        .populate('assignedStaff', 'name email');
    }

    res.json(engagements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new engagement
// @route   POST /api/engagements
// @access  Private (Manager/Admin only)
router.post('/', protect, managerOrAdmin, async (req, res) => {
  const { clientId, name, status, dueDate, workType, billable, assignedStaff } = req.body;

  try {
    const engagement = new Engagement({
      clientId,
      name,
      status: status || 'unassigned',
      dueDate,
      workType,
      billable: billable !== undefined ? billable : true,
      assignedStaff: assignedStaff || []
    });

    const createdEngagement = await engagement.save();
    
    const populated = await Engagement.findById(createdEngagement._id)
      .populate('clientId', 'name industry')
      .populate('assignedStaff', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, managerOrAdmin, async (req, res) => {
  const { clientId, name, status, dueDate, workType, billable, assignedStaff } = req.body;

  try {
    const engagement = await Engagement.findById(req.params.id);

    if (engagement) {
      if (clientId && clientId.toString() !== engagement.clientId.toString()) {
        // Remove from old client
        await Client.findByIdAndUpdate(engagement.clientId, {
          $pull: { engagements: engagement._id }
        });
        // Add to new client
        await Client.findByIdAndUpdate(clientId, {
          $addToSet: { engagements: engagement._id }
        });
        engagement.clientId = clientId;
      }
      engagement.name = name || engagement.name;
      engagement.status = status || engagement.status;
      engagement.dueDate = dueDate || engagement.dueDate;
      if (workType !== undefined) engagement.workType = workType;
      if (billable !== undefined) engagement.billable = billable;
      if (assignedStaff) engagement.assignedStaff = assignedStaff;

      const updatedEngagement = await engagement.save();

      const populated = await Engagement.findById(updatedEngagement._id)
        .populate('clientId', 'name industry')
        .populate('assignedStaff', 'name email');

      res.json(populated);
    } else {
      res.status(404).json({ message: 'Engagement not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Mark engagement as completed/review_pending by Staff
// @route   PUT /api/engagements/:id/mark-done
// @access  Private
router.put('/:id/mark-done', protect, async (req, res) => {
  try {
    const engagement = await Engagement.findById(req.params.id);

    if (!engagement) {
      return res.status(404).json({ message: 'Engagement not found' });
    }

    // Ensure staff member is actually assigned to this project
    if (req.user.role === 'staff' && !engagement.assignedStaff.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized: You are not assigned to this engagement' });
    }

    // Update status to review_pending
    engagement.status = 'review_pending';
    await engagement.save();

    // Trigger notification alert to reporting manager
    if (req.user.managerId) {
      await Notification.create({
        recipientId: req.user.managerId,
        title: 'Engagement Ready for Audit',
        body: `Staff member ${req.user.name} has marked the engagement "${engagement.name}" as completed and ready for final quality audit.`
      });
    } else {
      // If no direct manager, notify all managers/admins
      const supervisors = await Employee.find({ role: { $in: ['manager', 'admin'] } });
      for (const supervisor of supervisors) {
        await Notification.create({
          recipientId: supervisor._id,
          title: 'Engagement Ready for Audit',
          body: `Staff member ${req.user.name} has marked the engagement "${engagement.name}" as completed and ready for final quality audit.`
        });
      }
    }

    res.json({ message: 'Engagement marked as ready for review', engagement });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Bulk create engagements
// @route   POST /api/engagements/bulk
// @access  Private (Manager/Admin only)
router.post('/bulk', protect, managerOrAdmin, async (req, res) => {
  const { engagements } = req.body;
  if (!engagements || !Array.isArray(engagements)) {
    return res.status(400).json({ message: 'Invalid payload: engagements array is required' });
  }

  const results = [];
  const errors = [];

  for (let i = 0; i < engagements.length; i++) {
    const item = engagements[i];
    const clientName = item.clientName || item.ClientName || item.client || item.Client;
    const name = item.name || item.Name || item.engagementName || item.EngagementName;
    const workType = item.workType || item.WorkType || item.worktype;
    const dueDateStr = item.dueDate || item.DueDate || item.duedate;
    const status = item.status || item.Status || 'unassigned';
    const billableStr = item.billable || item.Billable || 'true';

    if (!clientName) {
      errors.push(`Row ${i + 1}: Client Name is required`);
      continue;
    }
    if (!name) {
      errors.push(`Row ${i + 1}: Engagement Name is required`);
      continue;
    }
    if (!workType) {
      errors.push(`Row ${i + 1}: Work Type is required`);
      continue;
    }
    if (!dueDateStr) {
      errors.push(`Row ${i + 1}: Due Date is required`);
      continue;
    }

    try {
      // Find client by name (case-insensitive)
      let client = await Client.findOne({ name: { $regex: new RegExp(`^${clientName.trim()}$`, 'i') } });
      if (!client) {
        // Create new client
        client = new Client({
          name: clientName.trim(),
          status: 'Active',
          email: '',
          mobile: ''
        });
        await client.save();
      }

      const billable = billableStr.toString().toLowerCase() === 'false' ? false : true;
      const dueDate = new Date(dueDateStr);

      if (isNaN(dueDate.getTime())) {
        errors.push(`Row ${i + 1}: Invalid Due Date format (expected YYYY-MM-DD)`);
        continue;
      }

      const engagement = new Engagement({
        clientId: client._id,
        name: name.trim(),
        status: status.trim().toLowerCase(),
        workType: workType.trim(),
        dueDate,
        billable,
        assignedStaff: []
      });

      await engagement.save();

      // Add to client's engagements array
      client.engagements.push(engagement._id);
      await client.save();

      results.push(engagement);
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  res.status(201).json({
    message: `Successfully processed ${results.length} engagements.`,
    successCount: results.length,
    errors
  });
});

export default router;
