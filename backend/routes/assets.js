import express from 'express';
import HardwareConfig from '../models/HardwareConfig.js';
import Asset from '../models/Asset.js';
import { protect, adminOnly, managerOrAdmin } from '../middleware/auth.js';
import {
  createAsset,
  updateAsset,
  deleteAsset,
  assetCheckout,
  assetCheckin,
  getAssetHistory,
  getOverdueAssets,
  getDashboardStats
} from '../services/assetService.js';

const router = express.Router();

// ==========================================
// Hardware Configurations (Catalog)
// ==========================================

// @desc    Get hardware configurations
// @route   GET /api/assets/configs
// @access  Private
router.get('/configs', protect, async (req, res) => {
  try {
    const configs = await HardwareConfig.find({}).sort({ brand: 1, modelName: 1 });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create hardware configuration
// @route   POST /api/assets/configs
// @access  Private (Admin only)
router.post('/configs', protect, adminOnly, async (req, res) => {
  const { brand, modelName, deviceType, cpu, ram, storage, graphicsCard, operatingSystem, warrantyInfo, additionalSpecs } = req.body;

  try {
    const config = new HardwareConfig({
      brand: brand || 'Generic',
      modelName,
      deviceType: deviceType || 'Laptop',
      cpu, // processor
      ram,
      storage,
      graphicsCard: graphicsCard || 'Integrated',
      operatingSystem: operatingSystem || 'None',
      warrantyInfo: warrantyInfo || '',
      additionalSpecs: additionalSpecs || ''
    });
    const created = await config.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update hardware configuration
// @route   PUT /api/assets/configs/:id
// @access  Private (Admin only)
router.put('/configs/:id', protect, adminOnly, async (req, res) => {
  const { brand, modelName, deviceType, cpu, ram, storage, graphicsCard, operatingSystem, warrantyInfo, additionalSpecs } = req.body;

  try {
    const config = await HardwareConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'Hardware Configuration not found' });
    }

    if (brand !== undefined) config.brand = brand;
    if (modelName !== undefined) config.modelName = modelName;
    if (deviceType !== undefined) config.deviceType = deviceType;
    if (cpu !== undefined) config.cpu = cpu;
    if (ram !== undefined) config.ram = ram;
    if (storage !== undefined) config.storage = storage;
    if (graphicsCard !== undefined) config.graphicsCard = graphicsCard;
    if (operatingSystem !== undefined) config.operatingSystem = operatingSystem;
    if (warrantyInfo !== undefined) config.warrantyInfo = warrantyInfo;
    if (additionalSpecs !== undefined) config.additionalSpecs = additionalSpecs;

    const updated = await config.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete hardware configuration
// @route   DELETE /api/assets/configs/:id
// @access  Private (Admin only)
router.delete('/configs/:id', protect, adminOnly, async (req, res) => {
  try {
    const config = await HardwareConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'Hardware Configuration not found' });
    }

    // Check if configuration is in use by any assets
    const inUse = await Asset.countDocuments({ configId: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({ message: 'Cannot delete configuration in use by physical assets' });
    }

    await HardwareConfig.findByIdAndDelete(req.params.id);
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// Asset Inventory Stock
// ==========================================

// @desc    Get all assets (with advanced search & filters)
// @route   GET /api/assets
// @access  Private
router.get('/', protect, async (req, res) => {
  const { search, status, employeeId, deviceType } = req.query;
  
  try {
    let query = {};
    
    if (status) {
      query.status = status;
    }
    if (employeeId) {
      query.currentUserId = employeeId;
    }

    // Filter by Device Type if selected (requires querying configurations first)
    if (deviceType) {
      const typeConfigs = await HardwareConfig.find({ deviceType }).select('_id');
      const typeConfigIds = typeConfigs.map(c => c._id);
      query.configId = { $in: typeConfigIds };
    }

    // Search query
    if (search) {
      // Find configs matching search name or brand
      const searchConfigs = await HardwareConfig.find({
        $or: [
          { modelName: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const searchConfigIds = searchConfigs.map(c => c._id);

      query.$or = [
        { assetTag: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } },
        { configId: { $in: searchConfigIds } }
      ];
    }

    const assets = await Asset.find(query)
      .populate('configId')
      .populate('currentUserId', 'name email role')
      .sort({ createdAt: -1 });

    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// Reports, Metrics & History
// ==========================================

// @desc    Get complete audit movement logs (chronological global)
// @route   GET /api/assets/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  const { search } = req.query;

  try {
    let query = {};

    if (search) {
      // Find assets matching query tag or serial
      const searchAssets = await Asset.find({
        $or: [
          { assetTag: { $regex: search, $options: 'i' } },
          { serialNumber: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const assetIds = searchAssets.map(a => a._id);

      // Find employees matching name
      const searchEmployees = await Asset.find({}).populate({
        path: 'currentUserId',
        match: { name: { $regex: search, $options: 'i' } }
      });
      
      // Let's search inside employee objects
      const employeeIds = await Asset.db.model('Employee').find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');

      query.$or = [
        { assetId: { $in: assetIds } },
        { employeeId: { $in: employeeIds } }
      ];
    }

    const history = await Asset.db.model('AssetMovement').find(query)
      .populate({
        path: 'assetId',
        populate: { path: 'configId' }
      })
      .populate('employeeId', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role')
      .sort({ checkoutDate: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get active overdue return assets
// @route   GET /api/assets/overdue
// @access  Private
router.get('/overdue/list', protect, async (req, res) => {
  try {
    const overdue = await getOverdueAssets();
    res.json(overdue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get telemetry, dashboard graphs and summaries
// @route   GET /api/assets/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get asset details by ID
// @route   GET /api/assets/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('configId')
      .populate('currentUserId', 'name email role');
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add physical asset to inventory
// @route   POST /api/assets
// @access  Private (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const asset = await createAsset(req.body, req.user._id);
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update asset details
// @route   PUT /api/assets/:id
// @access  Private (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const asset = await updateAsset(req.params.id, req.body, req.user._id);
    res.json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete physical asset
// @route   DELETE /api/assets/:id
// @access  Private (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const result = await deleteAsset(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==========================================
// Checkout / Check-in Operations
// ==========================================

// @desc    Checkout asset to employee
// @route   POST /api/assets/checkout
// @access  Private (Admin only)
router.post('/checkout', protect, adminOnly, async (req, res) => {
  try {
    const asset = await assetCheckout(req.body, req.user._id);
    res.json({ message: 'Asset checked out successfully', asset });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Check-in returned asset
// @route   POST /api/assets/checkin
// @access  Private (Admin only)
router.post('/checkin', protect, adminOnly, async (req, res) => {
  try {
    const asset = await assetCheckin(req.body, req.user._id);
    res.json({ message: 'Asset checked in successfully', asset });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



// @desc    Get movement timeline history of a single asset
// @route   GET /api/assets/:id/history
// @access  Private
router.get('/:id/history', protect, async (req, res) => {
  try {
    const history = await getAssetHistory(req.params.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});





export default router;
