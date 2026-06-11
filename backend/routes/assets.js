import express from 'express';
import HardwareConfig from '../models/HardwareConfig.js';
import Asset from '../models/Asset.js';
import AssetMovement from '../models/AssetMovement.js';
import Notification from '../models/Notification.js';
import Employee from '../models/Employee.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// Hardware Configurations
// ==========================================

// @desc    Get hardware configurations
// @route   GET /api/assets/configs
// @access  Private
router.get('/configs', protect, async (req, res) => {
  try {
    const configs = await HardwareConfig.find({});
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create hardware configuration
// @route   POST /api/assets/configs
// @access  Private (Admin only)
router.post('/configs', protect, adminOnly, async (req, res) => {
  const { modelName, cpu, ram, storage } = req.body;

  try {
    const config = new HardwareConfig({ modelName, cpu, ram, storage });
    const created = await config.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// Asset Inventory
// ==========================================

// @desc    Get all assets (with search/filter support)
// @route   GET /api/assets
// @access  Private
router.get('/', protect, async (req, res) => {
  const { search, status, employeeId } = req.query;
  
  try {
    let query = {};
    
    if (status) {
      query.status = status;
    }
    if (employeeId) {
      query.currentUserId = employeeId;
    }

    if (search) {
      // Find configs matching search name
      const configs = await HardwareConfig.find({ modelName: { $regex: search, $options: 'i' } }).select('_id');
      const configIds = configs.map(c => c._id);

      query.$or = [
        { assetTag: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { configId: { $in: configIds } }
      ];
    }

    const assets = await Asset.find(query)
      .populate('configId')
      .populate('currentUserId', 'name email role');

    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add physical asset to inventory
// @route   POST /api/assets
// @access  Private (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  const { configId, assetTag, serialNumber, status } = req.body;

  try {
    const assetExists = await Asset.findOne({ $or: [{ assetTag }, { serialNumber }] });
    if (assetExists) {
      return res.status(400).json({ message: 'Asset Tag or Serial Number already exists' });
    }

    const asset = new Asset({
      configId,
      assetTag,
      serialNumber,
      status: status || 'In Office',
      currentUserId: null
    });

    const created = await asset.save();
    const populated = await Asset.findById(created._id).populate('configId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// Checkout / Check-in Workflow
// ==========================================

// @desc    Checkout an asset to an employee
// @route   POST /api/assets/checkout
// @access  Private (Admin only)
router.post('/checkout', protect, adminOnly, async (req, res) => {
  const { assetId, employeeId, expectedReturnDate, checkoutCondition, deploymentLocation } = req.body;

  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.currentUserId) {
      return res.status(400).json({ message: 'Asset is already checked out' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update asset details
    asset.status = deploymentLocation || 'Deployed at Client'; // Can be 'Deployed at Client' or 'In Office' under possession
    asset.currentUserId = employeeId;
    await asset.save();

    // Log the movement
    const movement = new AssetMovement({
      assetId,
      employeeId,
      expectedReturnDate,
      checkoutCondition,
      checkoutDate: new Date()
    });
    await movement.save();

    // Create Notification for the staff member
    await Notification.create({
      recipientId: employeeId,
      title: 'IT Asset Issued',
      body: `You have been issued asset ${asset.assetTag} (S/N: ${asset.serialNumber}). Expected return date: ${new Date(expectedReturnDate).toLocaleDateString()}.`
    });

    res.json({ message: 'Asset checked out successfully', asset });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Check-in (Return) an asset
// @route   POST /api/assets/checkin
// @access  Private (Admin only)
router.post('/checkin', protect, adminOnly, async (req, res) => {
  const { assetId, returnCondition } = req.body;

  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (!asset.currentUserId) {
      return res.status(400).json({ message: 'Asset is not checked out' });
    }

    const previousUserId = asset.currentUserId;

    // Find the active movement log
    const movement = await AssetMovement.findOne({
      assetId,
      employeeId: previousUserId,
      actualReturnDate: null
    });

    if (movement) {
      movement.actualReturnDate = new Date();
      movement.returnCondition = returnCondition || 'Good';
      await movement.save();
    }

    // Reset asset status
    asset.status = 'In Office';
    asset.currentUserId = null;
    await asset.save();

    // Create Notification for the returned staff member
    await Notification.create({
      recipientId: previousUserId,
      title: 'IT Asset Returned',
      body: `Your return for asset ${asset.assetTag} was completed. Logged condition: ${returnCondition || 'Good'}.`
    });

    res.json({ message: 'Asset checked in successfully', asset });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// Reports & History
// ==========================================

// @desc    Get movement history logs
// @route   GET /api/assets/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  const { search } = req.query;

  try {
    let query = {};

    if (search) {
      // Find assets matching query tag or serial
      const assets = await Asset.find({
        $or: [
          { assetTag: { $regex: search, $options: 'i' } },
          { serialNumber: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const assetIds = assets.map(a => a._id);

      // Find employees matching name
      const employees = await Employee.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const employeeIds = employees.map(e => e._id);

      query.$or = [
        { assetId: { $in: assetIds } },
        { employeeId: { $in: employeeIds } }
      ];
    }

    const history = await AssetMovement.find(query)
      .populate({
        path: 'assetId',
        populate: { path: 'configId' }
      })
      .populate('employeeId', 'name email role')
      .sort({ checkoutDate: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get Asset dashboard counts and overdue alerts
// @route   GET /api/assets/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const totalCount = await Asset.countDocuments({});
    const inOfficeCount = await Asset.countDocuments({ status: 'In Office' });
    const deployedCount = await Asset.countDocuments({ status: 'Deployed at Client' });
    const maintenanceCount = await Asset.countDocuments({ status: 'Maintenance' });

    // Identify overdue assets
    const activeMovements = await AssetMovement.find({ actualReturnDate: null })
      .populate({
        path: 'assetId',
        populate: { path: 'configId' }
      })
      .populate('employeeId', 'name email role');

    const now = new Date();
    const overdue = activeMovements.filter(m => new Date(m.expectedReturnDate) < now);

    res.json({
      summary: {
        total: totalCount,
        inOffice: inOfficeCount,
        deployed: deployedCount,
        maintenance: maintenanceCount
      },
      overdue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
