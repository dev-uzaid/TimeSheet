import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { seedDatabase } from './config/seed.js';

// Import Routes
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import clientRoutes from './routes/clients.js';
import engagementRoutes from './routes/engagements.js';
import timesheetRoutes from './routes/timesheets.js';
import assetRoutes from './routes/assets.js';
import defaulterRoutes from './routes/defaulters.js';
import notificationRoutes from './routes/notifications.js';
import workTypeRoutes from './routes/workType.js';
import companyRoutes from './routes/companyRoutes.js';

// Load Environment Variables
dotenv.config();

// Connect to MongoDB
await connectDB();

// Seed Initial Mock Data
await seedDatabase();

// Initialize Defaulter Compliance Scheduled Jobs
import { initDefaulterCron } from './services/defaulterCron.js';
initDefaulterCron();

const app = express();

// Express Middleware
app.use(cors());
app.use(express.json());

// Bind API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/engagements', engagementRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/defaulters', defaulterRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/workType', workTypeRoutes);
app.use('/api/companies', companyRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('Professional Services Management System API is running...');
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
