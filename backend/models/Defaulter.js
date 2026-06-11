import mongoose from 'mongoose';

const defaulterSchema = new mongoose.Schema({
  weekStartDate: { type: String, required: true }, // Format: YYYY-MM-DD (typically Monday of the target week)
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  type: { 
    type: String, 
    enum: ['zero', 'partial'], 
    required: true 
  },
  missingDays: [{ type: String }] // List of missing days, e.g., ['Monday', 'Tuesday']
}, { timestamps: true });

const Defaulter = mongoose.model('Defaulter', defaulterSchema);
export default Defaulter;
