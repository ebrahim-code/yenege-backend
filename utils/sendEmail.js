const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change to your preferred email service
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your email password or app password
    },
  });
};

// Send verification email
exports.sendVerificationEmail = async (email, name, verificationToken) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: `"Yenege Marketplace" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Yenege Marketplace',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Yenege!</h1>
              <p>Empowering Ethiopian Women Artisans</p>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for joining Yenege Marketplace! We're excited to have you as part of our community connecting Ethiopian women artisans with global customers.</p>
              
              <p><strong>Alhamdulillah</strong>, you're now one step away from exploring authentic Ethiopian handmade products and supporting local artisans.</p>
              
              <p>To complete your registration, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">✓ Verify My Email</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #10b981;">${verificationUrl}</p>
              
              <p>This link will expire in 24 hours.</p>
              
              <p>If you didn't create an account on Yenege, please ignore this email.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p><strong>What's Next?</strong></p>
              <ul>
                <li>✨ Browse unique Ethiopian artisan products</li>
                <li>🛍️ Support women entrepreneurs directly</li>
                <li>🎨 Discover traditional crafts and cultural heritage</li>
                <li>💬 Chat with sellers and get AI recommendations</li>
              </ul>
            </div>
            <div class="footer">
              <p>© 2024 Yenege Marketplace. All rights reserved.</p>
              <p>Questions? Contact us at support@yenege.com</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, name, resetToken) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"Yenege Marketplace" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - Yenege Marketplace',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>We received a request to reset your password for your Yenege Marketplace account.</p>
              
              <div class="warning">
                <strong>⚠️ Didn't request this?</strong><br>
                If you didn't request a password reset, please ignore this email or contact support immediately.
              </div>
              
              <p>To reset your password, click the button below:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">🔄 Reset My Password</a>
              </div>
              
              <p>Or copy and paste this link:</p>
              <p style="word-break: break-all; color: #f59e0b;">${resetUrl}</p>
              
              <p><strong>This link expires in 1 hour.</strong></p>
              
              <p>After resetting your password, we recommend:</p>
              <ul>
                <li>Using a strong, unique password</li>
                <li>Not sharing your password with anyone</li>
                <li>Enabling two-factor authentication if available</li>
              </ul>
            </div>
          </div>
        </body>
      </html>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send order confirmation email
exports.sendOrderConfirmation = async (email, name, orderDetails) => {
  const transporter = createTransporter();
  
  const itemsList = orderDetails.items.map(item => 
    `<li>${item.title} x ${item.quantity} - ETB ${item.price.toLocaleString()}</li>`
  ).join('');
  
  const mailOptions = {
    from: `"Yenege Marketplace" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order Confirmation #${orderDetails._id.slice(-6).toUpperCase()}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .total { font-size: 24px; font-weight: bold; color: #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Order Confirmed!</h1>
              <p>Thank you for your purchase</p>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your order has been placed successfully! Alhamdulillah, you've just supported an Ethiopian artisan.</p>
              
              <div class="order-info">
                <h3>Order Details</h3>
                <p><strong>Order #:</strong> ${orderDetails._id.slice(-6).toUpperCase()}</p>
                <p><strong>Date:</strong> ${new Date(orderDetails.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${orderDetails.status}</p>
                
                <h4>Items Ordered:</h4>
                <ul>${itemsList}</ul>
                
                <p class="total">Total: ETB ${orderDetails.totalAmount.toLocaleString()}</p>
              </div>
              
              <p><strong>Shipping Address:</strong><br>
              ${orderDetails.shippingAddress.fullName}<br>
              ${orderDetails.shippingAddress.address}<br>
              ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.country}<br>
              ${orderDetails.shippingAddress.phone}</p>
              
              <p>We'll notify you when your order ships. You can track your order status in your dashboard.</p>
              
              <p><strong>Questions about your order?</strong><br>
              Reply to this email or contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw new Error('Failed to send order confirmation email');
  }
};

// Send welcome email (after verification)
exports.sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Yenege Marketplace" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Welcome to Yenege Family!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px; text-align: center; border-radius: 10px; }
            .content { padding: 30px; }
            .feature { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎊 Welcome Aboard!</h1>
              <p>Your email has been verified</p>
            </div>
            <div class="content">
              <h2>Dear ${name},</h2>
              <p><strong>Alhamdulillah!</strong> Your email has been successfully verified. Welcome to the Yenege family!</p>
              
              <p>You're now part of a movement that empowers Ethiopian women artisans and preserves ancient cultural traditions.</p>
              
              <div class="feature">
                <h3>🛍️ Shop Authentic Products</h3>
                <p>Browse thousands of handmade Ethiopian artisan products</p>
              </div>
              
              <div class="feature">
                <h3>💬 Direct Communication</h3>
                <p>Chat with sellers and get AI-powered recommendations</p>
              </div>
              
              <div class="feature">
                <h3>📦 Order Tracking</h3>
                <p>Track your orders from artisan to your doorstep</p>
              </div>
              
              <div class="feature">
                <h3>⭐ Reviews & Ratings</h3>
                <p>Share your experiences and help the community</p>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}" style="background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Start Shopping Now</a>
              </p>
              
              <p>Thank you for supporting Ethiopian artisans and their communities!</p>
              
              <p>With gratitude,<br>The Yenege Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};
