import mongoose from 'mongoose';

const engagementSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  name: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['unassigned', 'work_in_progress', 'review_pending', 'completed', 'billed'], 
    default: 'unassigned' 
  },
  workType : { type : String, required : true},  
  dueDate: { type: Date, required: true },
  billable: { type: Boolean, default: true },
  assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }]
}, { timestamps: true });

const Engagement = mongoose.model('Engagement', engagementSchema);
export default Engagement;
