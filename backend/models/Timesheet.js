import mongoose from 'mongoose';

const timesheetSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  engagementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Engagement', required: true },
  workType: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  hours: { type: Number, required: true, min: 0.1, max: 24 },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'approved', 'rejected', 'queried'], 
    default: 'draft' 
  },
  rejectionComment: { type: String, default: '' },
  markedDone: { type: Boolean, default: false } // Trigger to complete engagement review
}, { timestamps: true });

const Timesheet = mongoose.model('Timesheet', timesheetSchema);
export default Timesheet;
