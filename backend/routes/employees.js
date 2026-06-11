import express from 'express';
import Employee from '../models/Employee.js';
import { protect, adminOnly, managerOrAdmin } from '../middleware/auth.js';

const router = express.Router();


router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const admins = await Employee.find({ $or: [{ role: "admin" }, { role: "manager" }] }).select("_id name");
    res.json(admins);
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Managers & Admins)
router.get('/', protect, managerOrAdmin, async (req, res) => {
  try {
    const employees = await Employee.find({})
      .populate('managerId', 'name email')
      .populate('company', 'companyName')
      .select('-password');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all managers
// @route   GET /api/employees/managers
// @access  Private
router.get('/managers', protect, async (req, res) => {
  try {
    const managers = await Employee.find({ role: 'manager' }).select('name email');
    res.json(managers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  const { name, email, password, role, managerId, company } = req.body;
  console.log("Data", req.body);

  try {
    const userExists = await Employee.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const employee = await Employee.create({
      name,
      email,
      password,
      role,
      managerId: managerId || null,
      company
    });

    res.status(201).json({
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      managerId: employee.managerId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (employee) {
      await Employee.deleteOne({ _id: employee._id });
      res.json({ message: 'Employee removed' });
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
