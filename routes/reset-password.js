const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const router = express.Router();

const User = require('../models/User');

// No in-memory tokens; use DB fields

// Request Reset Form
router.get('/reset-password', (req, res) => {
  res.render('reset-password');
});

// Handle Reset Request

router.post('/reset-password', async (req, res) => {
  const email = req.body.email;
  const token = crypto.randomBytes(20).toString('hex');
  const expire = Date.now() + 3600000;
  const user = await User.findOne({ email });
  if (!user) return res.send('No user with that email.');
  user.resetPasswordToken = token;
  user.resetPasswordExpire = expire;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'bae23-gchimwaza@poly.ac.mw',  // <-- change to yours
      pass:'ubwncazfnhjfqguh'     // <-- change to your Gmail app password
    }
  });


 const resetLink =`http://web-gun6.onrender.com/reset-form/${token}`;

console.log('Reset link:', resetLink);

const mailOptions = {
  from: 'bae23-gchimwaza@poly.ac.mw',
  to: email,
  subject: 'Password Reset Request',
  text: `Click here to reset your password: ${resetLink}`,
  html: `<p>Hello,</p><p>You requested a password reset. Click the link below to reset your password:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Thyank you. have a great day.</p>
  `
};

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.error(err);
      return res.send('Error sending email.');
    }
    res.send('Password reset link sent to your email.');
  });
});

// Show Reset Form
router.get('/reset-form/:token', async (req, res) => {
  const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) {
    return res.send('Token invalid or expired.');
  }
  res.render('reset-form', { token: req.params.token });
});

// Handle New Password Submission
router.post('/reset-form/:token', async (req, res) => {
  const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) {
    return res.send('Token expired.');
  }
  const newPassword = req.body.password;
  // You should hash the password in production!
  user.passwordHash = await require('bcrypt').hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.send('Password reset successful. You can now <a href="/login">Log in</a>');
});

module.exports = router;

