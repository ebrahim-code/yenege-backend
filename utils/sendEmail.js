const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check env vars each time — safer than module-level transporter
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.error('[EMAIL ERROR] EMAIL_USER or EMAIL_PASS environment variable is not set!');
    return false;
  }

  try {
    // Create transporter inside function so it always uses current env values
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const message = {
      from: `${process.env.FROM_NAME || 'Yenege'} <${emailUser}>`,
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
