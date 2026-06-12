import mongoose from 'mongoose';

const assetMovementSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  checkoutDate: { type: Date, default: Date.now },
  expectedReturnDate: { type: Date, required: true },
  actualReturnDate: { type: Date, default: null },
  checkoutCondition: { type: String, required: true },
  returnCondition: { type: String, default: null },
  remarks: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null }
}, { timestamps: true });

const AssetMovement = mongoose.model('AssetMovement', assetMovementSchema);
export default AssetMovement;
