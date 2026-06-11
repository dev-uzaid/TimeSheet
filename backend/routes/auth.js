import express from 'express';
import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const employee = await Employee.findOne({ email });

    if (employee && (await employee.matchPassword(password))) {
      res.json({
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        managerId: employee.managerId,
        token: generateToken(employee._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  const employee = await Employee.findById(req.user._id).populate('managerId', 'name email');
  if (employee) {
    res.json(employee);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

export default router;
