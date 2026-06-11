import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String },
  status: { type: String, default: 'Active', enum: ["Inactive", "Active", "inactive", "active", "InActive"] },
  email: { type: String },
  engagements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Engagement' }],
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);
export default Client;
