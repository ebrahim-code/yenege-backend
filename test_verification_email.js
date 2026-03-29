require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

// Test email sending for verification code
async function testVerificationEmail() {
  try {
    console.log('Testing verification email...\n');

    // Generate a sample OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Yenege!</h1>
          <p style="color: #e5e7eb; margin-top: 10px;">Ethiopia's Premier Online Marketplace</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email</h2>
          <p style="color: #4b5563; line-height: 1.6;">Hello Test User,</p>
          <p style="color: #4b5563; line-height: 1.6;">Thank you for registering on Yenege! To complete your registration, please use the verification code below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">This code will expire in <strong>1 hour</strong>.</p>
          <p style="color: #4b5563; line-height: 1.6;">If you didn't create this account, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Yenege Team</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Yenege Marketplace. All rights reserved.</p>
        </div>
      </div>
    `;

    // Replace with your test email
    const testEmail = process.env.TEST_EMAIL || 'your-email@gmail.com';
    
    console.log(`Sending test email to: ${testEmail}`);
    console.log(`Generated OTP: ${otp}\n`);

    const result = await sendEmail({
      email: testEmail,
      subject: 'Test Verification Email - Yenege Marketplace',
      html: html
    });

    if (result) {
      console.log('\n✅ SUCCESS! Verification email sent successfully.');
      console.log('Check your inbox for the test verification email.');
    } else {
      console.log('\n❌ FAILED! Could not send verification email.');
      console.log('Check the error logs above for details.');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testVerificationEmail();
