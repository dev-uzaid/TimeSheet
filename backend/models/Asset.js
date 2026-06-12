import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  configId: { type: mongoose.Schema.Types.ObjectId, ref: 'HardwareConfig', required: true },
  assetTag: { type: String, required: true, unique: true },
  serialNumber: { type: String, required: true, unique: true },
  purchaseDate: { type: Date, default: null },
  purchaseCost: { type: Number, default: 0 },
  vendor: { type: String, default: '' },
  warrantyExpiryDate: { type: Date, default: null },
  status: { 
    type: String, 
    enum: ['In Office', 'Deployed at Client', 'Under Maintenance', 'Lost', 'Retired'], 
    default: 'In Office' 
  },
  currentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  currentLocation: { type: String, default: 'In Office' },
  assetCondition: { type: String, default: 'Good' },
  notes: { type: String, default: '' }
}, { timestamps: true });

const Asset = mongoose.model('Asset', assetSchema);
export default Asset;
