const express = require('express');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');

// POST /api/contact  – public route, no auth required
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address.' });
  }

  const adminEmail = process.env.EMAIL_USER; // send to the platform admin email

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
      <div style="background: #16a34a; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">📬 New Contact Message – Yenege</h1>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin-top: 0;">You received a new message from the Yenege contact form.</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 10px; background: #f3f4f6; font-weight: bold; color: #374151; width: 30%; border-radius: 4px;">Name</td>
            <td style="padding: 10px; color: #111827;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #374151;">Email</td>
            <td style="padding: 10px; color: #111827;"><a href="mailto:${email}" style="color: #16a34a;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px; background: #f3f4f6; font-weight: bold; color: #374151;">Subject</td>
            <td style="padding: 10px; color: #111827;">${subject}</td>
          </tr>
        </table>

        <div style="background: #f3f4f6; border-left: 4px solid #16a34a; padding: 16px; border-radius: 4px;">
          <p style="font-weight: bold; color: #374151; margin-top: 0;">Message:</p>
          <p style="color: #374151; white-space: pre-wrap; margin-bottom: 0;">${message}</p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; margin-bottom: 0;">
          This message was sent via the Yenege Contact page. Reply directly to <a href="mailto:${email}" style="color: #16a34a;">${email}</a>.
        </p>
      </div>
    </div>
  `;

  try {
    const sent = await sendEmail({
      email: adminEmail,
      subject: `[Yenege Contact] ${subject} – from ${name}`,
      html,
    });

    if (!sent) {
      return res.status(500).json({ message: 'Failed to send message. Please try again.' });
    }

    // Also send a confirmation to the sender
    await sendEmail({
      email,
      subject: 'We received your message – Yenege',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
          <div style="background: #16a34a; padding: 20px 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">✅ Message Received – Yenege</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p style="color: #374151;">Hi <strong>${name}</strong>,</p>
            <p style="color: #374151;">Thank you for reaching out! We have received your message and our team will get back to you within 24 hours.</p>
            <div style="background: #f3f4f6; border-left: 4px solid #16a34a; padding: 16px; border-radius: 4px; margin: 16px 0;">
              <p style="font-weight: bold; color: #374151; margin-top: 0;">Your message:</p>
              <p style="color: #6b7280; font-size: 14px; white-space: pre-wrap; margin-bottom: 0;">${message}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Best regards,<br><strong style="color: #16a34a;">The Yenege Team</strong></p>
          </div>
        </div>
      `,
    });

    res.json({ message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Contact route error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

module.exports = router;
