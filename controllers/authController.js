const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};

// Register a new company
exports.register = async (req, res) => {
  const { name, phone, companyName, email, employeeSize } = req.body;

  try {
    let company = await Company.findOne({ email });
    if (company) return res.status(400).json({ msg: 'Company already exists' });

    const otp = generateOTP();
    company = new Company({ name, phone, companyName, email, employeeSize, otp });

    await company.save();
    sendOTPEmail(company.email, otp);
    res.json({ msg: 'Company registered. Please verify your email with the OTP sent to your email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Send OTP email
const sendOTPEmail = (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Email with OTP',
    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #4CAF50;">Email Verification</h2>
      <p style="font-size: 16px;">
        Your OTP for email verification is:
      </p>
      <p style="font-size: 24px; font-weight: bold; color: #4CAF50;">
        ${otp}
      </p>
      <p style="font-size: 16px;">
        Please enter this OTP to verify your email address. This OTP is valid for a limited time.
      </p>
      <p style="font-size: 16px;">
        If you did not request this verification, please ignore this email.
      </p>
    </div>
  `,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.log(error);
    else console.log(`Email sent: ${info.response}`);
  });
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const company = await Company.findOne({ email });
    if (!company) return res.status(400).json({ msg: 'Company does not exist' });
    if (company.otp !== otp) return res.status(400).json({ msg: 'Invalid OTP' });

    company.isEmailVerified = true;
    company.otp = undefined; // Clear the OTP after verification
    await company.save();

    // Generate JWT token
    const token = jwt.sign({ company: { id: company._id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ msg: 'Email verified successfully', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Login (without password)
exports.login = async (req, res) => {
  const { email } = req.body;

  try {
    const company = await Company.findOne({ email });
    if (!company) return res.status(400).json({ msg: 'Company does not exist' });
    if (!company.isEmailVerified) return res.status(400).json({ msg: 'Email not verified' });

    const token = jwt.sign({ company: { id: company._id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};