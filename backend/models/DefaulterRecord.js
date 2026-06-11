import mongoose from 'mongoose';

const defaulterRecordSchema = new mongoose.Schema({
  weekStartDate: { 
    type: String, 
    required: true 
  }, // Format: YYYY-MM-DD (Monday of the target week)
  
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  
  employeeName: { 
    type: String, 
    required: true 
  },
  
  email: { 
    type: String, 
    required: true 
  },
  
  department: { 
    type: String, 
    default: 'General' 
  },
  
  manager: { 
    type: String, 
    default: 'N/A' 
  },
  
  defaulterType: { 
    type: String, 
    enum: ['Zero Entries', 'Partial Entries'], 
    required: true 
  },
  
  missingDates: [{ 
    type: String 
  }] // Format: YYYY-MM-DD dates missed
}, { timestamps: true });

const DefaulterRecord = mongoose.model('DefaulterRecord', defaulterRecordSchema);
export default DefaulterRecord;
