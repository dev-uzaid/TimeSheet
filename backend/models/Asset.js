import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  configId: { type: mongoose.Schema.Types.ObjectId, ref: 'HardwareConfig', required: true },
  assetTag: { type: String, required: true, unique: true },
  serialNumber: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['In Office', 'Deployed at Client', 'Maintenance'], 
    default: 'In Office' 
  },
  currentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null }
}, { timestamps: true });

const Asset = mongoose.model('Asset', assetSchema);
export default Asset;
