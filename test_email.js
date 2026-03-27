require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS, '| Length:', process.env.EMAIL_PASS?.length);

async function testEmail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
  } catch (err) {
    console.error('❌ SMTP connection failed:');
    console.error('  Code:', err.code);
    console.error('  Message:', err.message);
    console.error('  Response:', err.response);
    process.exit(1);
  }

  try {
    console.log('Sending test email to:', process.env.EMAIL_USER);
    const info = await transporter.sendMail({
      from: `Yenege Test <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Yenege Email Test',
      html: '<b>Test email from Yenege backend. If you see this, email works!</b>',
    });
    console.log('✅ Email sent! MessageId:', info.messageId);
  } catch (err) {
    console.error('❌ Failed to send email:');
    console.error('  Code:', err.code);
    console.error('  Message:', err.message);
    console.error('  Response:', err.response);
  }
}

testEmail();
