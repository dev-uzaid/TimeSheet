import mongoose from 'mongoose';

const hardwareConfigSchema = new mongoose.Schema({
  modelName: { type: String, required: true },
  cpu: { type: String, required: true },
  ram: { type: String, required: true }, // e.g. "16GB"
  storage: { type: String, required: true } // e.g. "512GB SSD"
}, { timestamps: true });

const HardwareConfig = mongoose.model('HardwareConfig', hardwareConfigSchema);
export default HardwareConfig;
