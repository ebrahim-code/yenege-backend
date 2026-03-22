const nodemailer = require('nodemailer');

// Create transporter once and reuse — avoids slow initialization per email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,           // use connection pooling for faster subsequent emails
  maxConnections: 5,
  rateDelta: 1000,
  rateLimit: 5,
});

const sendEmail = async (options) => {
  try {
    const message = {
      from: `${process.env.FROM_NAME || 'Yenege'} <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(message);
    console.log('[EMAIL] Sent successfully to:', options.email, '| MessageId:', info.messageId);
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send email to:', options.email);
    console.error('[EMAIL ERROR] Code:', error.code, '| Response:', error.response || error.message);
    return false;
  }
};

module.exports = sendEmail;
