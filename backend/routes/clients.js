import express from 'express';
import Client from '../models/Client.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';
import Engagement from '../models/Engagement.js';
const router = express.Router();

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const clients = await Client.find({}).populate('engagements', '_id name workType');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new client
// @route   POST /api/clients
// @access  Private (Manager/Admin only)
router.post('/', protect, managerOrAdmin, async (req, res) => {
  const { 
    name, 
    mobile, 
    email, 
    status,
    engagementName,
    engagementWorkType,
    engagementDueDate,
    engagementStatus,
    engagementBillable,
    engagementAssignedStaff 
  } = req.body;

  try {
    const client = new Client({
      name,
      mobile,
      email,
      status
    });

    let engagement;
    if (engagementName && engagementWorkType) {
      engagement = await Engagement.create({
        clientId: client._id,
        name: engagementName,
        workType: engagementWorkType,
        status: engagementStatus || 'unassigned',
        dueDate: engagementDueDate ? new Date(engagementDueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        billable: engagementBillable !== undefined ? engagementBillable : true,
        assignedStaff: engagementAssignedStaff || []
      });
    } else {
      engagement = await Engagement.create({
        name: `${name} - General`,
        clientId: client._id,
        workType: 'Consultation',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }
    client.engagements.push(engagement._id);

    const createdClient = await client.save();
    const populated = await Client.findById(createdClient._id).populate('engagements', '_id name workType');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private (Manager/Admin only)
router.put('/:id', protect, managerOrAdmin, async (req, res) => {
  const { name, mobile, email, status } = req.body;

  try {
    const client = await Client.findById(req.params.id);

    if (client) {
      client.name = name || client.name;
      client.mobile = mobile !== undefined ? mobile : client.mobile;
      client.email = email || client.email;
      client.status = status || client.status;

      const updatedClient = await client.save();
      const populated = await Client.findById(updatedClient._id).populate('engagements', '_id name workType');
      res.json(populated);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
