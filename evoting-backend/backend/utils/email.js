const nodemailer = require('nodemailer');

// Configure the Gmail transporter using your App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const info = await transporter.sendMail({
    from: `"SecureVote" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset Your SecureVote Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #16a34a; margin-bottom: 8px;">SecureVote</h2>
        <p style="color: #374151;">You requested to reset your password. Click the button below to set a new one. This link expires in <strong>15 minutes</strong>.</p>
        <a href="${resetUrl}"
           style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Reset Password
        </a>
        <p style="color: #6b7280; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #16a34a; font-size: 13px; word-break: break-all;">${resetUrl}</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
  return info;
}

module.exports = { sendPasswordResetEmail };