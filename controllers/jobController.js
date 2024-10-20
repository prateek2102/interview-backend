const Job = require('../models/Job');
const Company = require('../models/Company'); // Import the Company model
const nodemailer = require('nodemailer');

exports.createJob = async (req, res) => {
  const { jobTitle, jobDescription, experienceLevel, candidates, endDate } = req.body;

  // Ensure user is verified
  const company = await Company.findById(req.company.id);
  if (!company.isEmailVerified) return res.status(403).json({ msg: 'User not verified' });

  try {
    const job = new Job({ companyId: req.company.id, jobTitle, jobDescription, experienceLevel, candidates, endDate });
    await job.save();

    sendJobEmails(candidates, job);
    res.json({ msg: 'Job posted and emails sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Send job posting emails
const sendJobEmails = (candidates, job) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  candidates.forEach((email) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `New Job Posting: ${job.jobTitle}`,
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">New Job Posting: ${job.jobTitle}</h2>
        <p style="font-size: 16px; color: #555;">
          A new job has been posted:
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
              <strong>Job Title:</strong>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              ${job.jobTitle}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
              <strong>Description:</strong>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              ${job.jobDescription}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
              <strong>Experience Level:</strong>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              ${job.experienceLevel}
            </td>
          </tr>
        </table>
        <p style="font-size: 16px; color: #555;">
          Please visit our website for more details.
        </p>
      </div>
    `,
  };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.log(error);
      else console.log(`Email sent: ${info.response}`);
    });
  });
};