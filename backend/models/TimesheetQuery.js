import mongoose from 'mongoose';

const timesheetQuerySchema = new mongoose.Schema({
  timesheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timesheet', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  message: { type: String, required: true }
}, { timestamps: true });

const TimesheetQuery = mongoose.model('TimesheetQuery', timesheetQuerySchema);
export default TimesheetQuery;
