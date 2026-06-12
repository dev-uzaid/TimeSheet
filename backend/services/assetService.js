import Asset from '../models/Asset.js';
import HardwareConfig from '../models/HardwareConfig.js';
import AssetMovement from '../models/AssetMovement.js';
import Employee from '../models/Employee.js';
import Notification from '../models/Notification.js';

/**
 * Create a new physical asset in inventory.
 */
export const createAsset = async (assetData, adminId) => {
  const { configId, assetTag, serialNumber, status, purchaseDate, purchaseCost, vendor, warrantyExpiryDate, currentLocation, assetCondition, notes } = assetData;

  // Check unique constraints
  const assetExists = await Asset.findOne({ $or: [{ assetTag }, { serialNumber }] });
  if (assetExists) {
    throw new Error('Asset Tag or Serial Number already exists');
  }

  // Ensure hardware configuration exists
  const config = await HardwareConfig.findById(configId);
  if (!config) {
    throw new Error('Hardware Configuration not found');
  }

  const asset = new Asset({
    configId,
    assetTag,
    serialNumber,
    status: status || 'In Office',
    purchaseDate: purchaseDate || null,
    purchaseCost: purchaseCost || 0,
    vendor: vendor || '',
    warrantyExpiryDate: warrantyExpiryDate || null,
    currentLocation: currentLocation || 'In Office',
    assetCondition: assetCondition || 'Good',
    notes: notes || '',
    currentUserId: null
  });

  const savedAsset = await asset.save();
  return Asset.findById(savedAsset._id).populate('configId');
};

/**
 * Update an existing asset's metadata and specifications.
 */
export const updateAsset = async (assetId, assetData, adminId) => {
  const asset = await Asset.findById(assetId);
  if (!asset) {
    throw new Error('Asset not found');
  }

  const { assetTag, serialNumber, configId, status, purchaseDate, purchaseCost, vendor, warrantyExpiryDate, currentLocation, assetCondition, notes } = assetData;

  // Check unique constraints if changed
  if (assetTag && assetTag !== asset.assetTag) {
    const tagExists = await Asset.findOne({ assetTag });
    if (tagExists) throw new Error('Asset Tag already exists');
  }
  if (serialNumber && serialNumber !== asset.serialNumber) {
    const snExists = await Asset.findOne({ serialNumber });
    if (snExists) throw new Error('Serial Number already exists');
  }

  // Handle status rules: if retired, lost or in office, clear current holder
  if (status && status !== asset.status) {
    if (['In Office', 'Under Maintenance', 'Lost', 'Retired'].includes(status)) {
      // If was checked out, check it in
      if (asset.currentUserId) {
        const activeMovement = await AssetMovement.findOne({
          assetId,
          employeeId: asset.currentUserId,
          actualReturnDate: null
        });
        if (activeMovement) {
          activeMovement.actualReturnDate = new Date();
          activeMovement.returnCondition = assetCondition || asset.assetCondition;
          activeMovement.remarks = `Automatically returned due to status change to ${status}`;
          activeMovement.updatedBy = adminId;
          await activeMovement.save();
        }
        asset.currentUserId = null;
      }
    }
  }

  // Update fields
  if (configId) asset.configId = configId;
  if (assetTag) asset.assetTag = assetTag;
  if (serialNumber) asset.serialNumber = serialNumber;
  if (status) asset.status = status;
  if (purchaseDate !== undefined) asset.purchaseDate = purchaseDate;
  if (purchaseCost !== undefined) asset.purchaseCost = purchaseCost;
  if (vendor !== undefined) asset.vendor = vendor;
  if (warrantyExpiryDate !== undefined) asset.warrantyExpiryDate = warrantyExpiryDate;
  if (currentLocation !== undefined) asset.currentLocation = currentLocation;
  if (assetCondition !== undefined) asset.assetCondition = assetCondition;
  if (notes !== undefined) asset.notes = notes;

  const savedAsset = await asset.save();
  return Asset.findById(savedAsset._id).populate('configId').populate('currentUserId', 'name email role');
};

/**
 * Delete an asset from inventory.
 */
export const deleteAsset = async (assetId) => {
  const asset = await Asset.findById(assetId);
  if (!asset) {
    throw new Error('Asset not found');
  }

  // Prevent deleting assets currently checked out
  if (asset.currentUserId || asset.status === 'Deployed at Client') {
    throw new Error('Cannot delete asset that is currently deployed or checked out to an employee');
  }

  await Asset.findByIdAndDelete(assetId);
  return { success: true, message: 'Asset deleted successfully' };
};

/**
 * Checkout an asset to an employee (Assignment).
 */
export const assetCheckout = async (checkoutData, adminId) => {
  const { assetId, employeeId, checkoutDate, expectedReturnDate, checkoutCondition, remarks, deploymentLocation } = checkoutData;

  const asset = await Asset.findById(assetId);
  if (!asset) {
    throw new Error('Asset not found');
  }

  // Validation
  if (asset.currentUserId || asset.status === 'Deployed at Client') {
    throw new Error('Asset is already checked out to another employee');
  }

  if (['Under Maintenance', 'Lost', 'Retired'].includes(asset.status)) {
    throw new Error(`Asset cannot be checked out because its status is: ${asset.status}`);
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  const parsedCheckoutDate = checkoutDate ? new Date(checkoutDate) : new Date();

  // Create movement record
  const movement = new AssetMovement({
    assetId,
    employeeId,
    checkoutDate: parsedCheckoutDate,
    expectedReturnDate: new Date(expectedReturnDate),
    checkoutCondition: checkoutCondition || 'Good',
    remarks: remarks || '',
    createdBy: adminId
  });
  await movement.save();

  // Update asset status
  asset.status = 'Deployed at Client';
  asset.currentUserId = employeeId;
  asset.currentLocation = deploymentLocation || 'Deployed at Client';
  asset.assetCondition = checkoutCondition || asset.assetCondition;
  await asset.save();

  // Notify the employee
  await Notification.create({
    recipientId: employeeId,
    title: 'IT Hardware Issued to You',
    body: `Hardware asset ${asset.assetTag} (${asset.serialNumber}) has been checked out to you. Expected return date: ${new Date(expectedReturnDate).toLocaleDateString()}.`
  });

  return Asset.findById(assetId).populate('configId').populate('currentUserId', 'name email role');
};

/**
 * Return a checked out asset back to office (Check-in).
 */
export const assetCheckin = async (checkinData, adminId) => {
  const { assetId, returnDate, returnCondition, remarks } = checkinData;

  const asset = await Asset.findById(assetId);
  if (!asset) {
    throw new Error('Asset not found');
  }

  if (!asset.currentUserId) {
    throw new Error('Asset is not checked out');
  }

  const previousUserId = asset.currentUserId;
  const parsedReturnDate = returnDate ? new Date(returnDate) : new Date();

  // Find active movement log
  const movement = await AssetMovement.findOne({
    assetId,
    employeeId: previousUserId,
    actualReturnDate: null
  });

  if (movement) {
    movement.actualReturnDate = parsedReturnDate;
    movement.returnCondition = returnCondition || 'Good';
    movement.remarks = remarks ? `${movement.remarks}\nReturn Notes: ${remarks}` : movement.remarks;
    movement.updatedBy = adminId;
    await movement.save();
  }

  // Update asset
  asset.status = 'In Office';
  asset.currentUserId = null;
  asset.currentLocation = 'In Office';
  asset.assetCondition = returnCondition || asset.assetCondition;
  await asset.save();

  // Notify employee
  await Notification.create({
    recipientId: previousUserId,
    title: 'IT Hardware Returned Successfully',
    body: `Your return for asset ${asset.assetTag} was processed. Recorded condition: ${returnCondition || 'Good'}.`
  });

  return Asset.findById(assetId).populate('configId');
};

/**
 * Get chronological movement timeline for a specific asset.
 */
export const getAssetHistory = async (assetId) => {
  return await AssetMovement.find({ assetId })
    .populate('employeeId', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('updatedBy', 'name email role')
    .sort({ checkoutDate: -1 });
};

/**
 * Get overdue assignments.
 */
export const getOverdueAssets = async () => {
  const now = new Date();
  
  // Find active movements where expectedReturnDate has passed
  return await AssetMovement.find({
    actualReturnDate: null,
    expectedReturnDate: { $lt: now }
  })
    .populate({
      path: 'assetId',
      populate: { path: 'configId' }
    })
    .populate('employeeId', 'name email role')
    .sort({ expectedReturnDate: 1 });
};

/**
 * Get asset metrics, charts data, and activity feed.
 */
export const getDashboardStats = async () => {
  const now = new Date();

  // KPI Summary Card counts
  const total = await Asset.countDocuments({});
  const inOffice = await Asset.countDocuments({ status: 'In Office' });
  const deployed = await Asset.countDocuments({ status: 'Deployed at Client' });
  const maintenance = await Asset.countDocuments({ status: 'Under Maintenance' });
  const lost = await Asset.countDocuments({ status: 'Lost' });
  const retired = await Asset.countDocuments({ status: 'Retired' });

  // Overdue count
  const overdueCount = await AssetMovement.countDocuments({
    actualReturnDate: null,
    expectedReturnDate: { $lt: now }
  });

  // 1. Status Distribution
  const statusDistribution = [
    { name: 'In Office', value: inOffice },
    { name: 'Deployed at Client', value: deployed },
    { name: 'Under Maintenance', value: maintenance },
    { name: 'Lost', value: lost },
    { name: 'Retired', value: retired }
  ];

  // 2. Device Type breakdown
  // Aggregate using configurations
  const assets = await Asset.find({}).populate('configId');
  const typeMap = {};
  assets.forEach(a => {
    if (a.configId && a.configId.deviceType) {
      const type = a.configId.deviceType;
      typeMap[type] = (typeMap[type] || 0) + 1;
    } else {
      typeMap['Unknown'] = (typeMap['Unknown'] || 0) + 1;
    }
  });
  const deviceTypeDistribution = Object.keys(typeMap).map(key => ({
    name: key,
    value: typeMap[key]
  }));

  // 3. Monthly Movements (Last 6 Months)
  const monthlyMovements = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    const checkouts = await AssetMovement.countDocuments({
      checkoutDate: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const returns = await AssetMovement.countDocuments({
      actualReturnDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const monthLabel = d.toLocaleString('default', { month: 'short' });
    monthlyMovements.push({
      month: monthLabel,
      checkouts,
      returns
    });
  }

  // 4. Allocation by Employee
  const allocationMap = {};
  assets.forEach(a => {
    if (a.currentUserId) {
      const empId = a.currentUserId.toString();
      allocationMap[empId] = (allocationMap[empId] || { count: 0 });
      allocationMap[empId].count += 1;
    }
  });

  // Populate names
  const allocationByEmployee = [];
  const activeHolderIds = Object.keys(allocationMap);
  if (activeHolderIds.length > 0) {
    const employees = await Employee.find({ _id: { $in: activeHolderIds } });
    employees.forEach(emp => {
      allocationByEmployee.push({
        name: emp.name,
        count: allocationMap[emp._id.toString()].count
      });
    });
  }

  // Recent Movements (last 8)
  const recentActivity = await AssetMovement.find({})
    .populate({
      path: 'assetId',
      populate: { path: 'configId' }
    })
    .populate('employeeId', 'name email')
    .sort({ createdAt: -1 })
    .limit(8);

  return {
    summary: {
      total,
      inOffice,
      deployed,
      maintenance,
      lost,
      retired,
      overdue: overdueCount
    },
    charts: {
      statusDistribution,
      deviceTypeDistribution,
      monthlyMovements,
      allocationByEmployee
    },
    recentActivity
  };
};
