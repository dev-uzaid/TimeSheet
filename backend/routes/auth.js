import express from 'express';
import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';
import { protect } from '../middleware/auth.js';
import crypto from 'crypto';

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

// @desc    Forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found with that email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    employee.resetPasswordToken = resetToken;
    employee.resetPasswordExpire = Date.now() + 3600000; // 1 hour expiration
    await employee.save();

    // Create reset URL
    const resetUrl = `${req.headers.origin || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Send email using Brevo Transactional API
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error('Brevo API Key is missing in environment variables');
      return res.status(500).json({ message: 'Mail server key configuration missing' });
    }

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'TimeSheet App Support', email: 'support@firm.com' },
        to: [{ email: employee.email, name: employee.name }],
        subject: 'TimeSheet App - Password Reset Link',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #6366f1; text-align: center;">TimeSheet App Password Recovery</h2>
            <p>Hello <strong>${employee.name}</strong>,</p>
            <p>You requested a password reset for your TimeSheet App account. Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4b5563;">${resetUrl}</p>
            <p style="margin-top: 30px; font-size: 0.85rem; color: #9ca3af; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px;">
              If you did not request this, please ignore this email.
            </p>
          </div>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Brevo Email sending failed:', errorText);
      return res.status(500).json({ message: 'Failed to send reset email. Contact administrator.' });
    }

    res.json({ message: 'Password reset link sent to email successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  try {
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const employee = await Employee.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!employee) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    // Set new password
    employee.password = password;
    employee.resetPasswordToken = null;
    employee.resetPasswordExpire = null;
    await employee.save();

    res.json({ message: 'Password has been reset successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
