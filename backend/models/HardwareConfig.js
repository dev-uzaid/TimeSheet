import mongoose from 'mongoose';

const hardwareConfigSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  modelName: { type: String, required: true }, // Model name
  deviceType: { 
    type: String, 
    required: true, 
    enum: ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Server', 'Mobile', 'Other'] 
  },
  cpu: { type: String, required: true }, // Processor
  ram: { type: String, required: true },
  storage: { type: String, required: true },
  graphicsCard: { type: String, default: 'Integrated' },
  operatingSystem: { type: String, default: 'None' },
  warrantyInfo: { type: String, default: '' },
  additionalSpecs: { type: String, default: '' }
}, { timestamps: true });

const HardwareConfig = mongoose.model('HardwareConfig', hardwareConfigSchema);
export default HardwareConfig;
