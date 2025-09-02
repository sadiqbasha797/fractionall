const fs = require('fs');
const path = require('path');
const { createTransporter } = require('../config/mail');
const logger = require('./logger');

// Helper function to read and process email templates
const readTemplate = (templateName) => {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    logger(`Error reading template ${templateName}: ${error.message}`);
    throw new Error(`Template ${templateName} not found`);
  }
};

// Helper function to replace placeholders in templates
const replacePlaceholders = (template, data) => {
  let processedTemplate = template;
  
  // Replace all {{placeholder}} with actual data
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    processedTemplate = processedTemplate.replace(placeholder, value || '');
  }
  
  return processedTemplate;
};

// Generic email sending function
const sendEmail = async (to, subject, htmlContent, textContent = null) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Fraction - Car Sharing',
        address: process.env.MAIL
      },
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    logger(`Email sent successfully to ${to}: ${result.messageId}`);
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    logger(`Error sending email to ${to}: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

// Welcome email for new user registration
const sendWelcomeEmail = async (userDetails) => {
  try {
    const template = readTemplate('welcome');
    
    const templateData = {
      userName: userDetails.name,
      userEmail: userDetails.email,
      registrationDate: new Date(userDetails.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      kycLink: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/kyc-verification`
    };
    
    const htmlContent = replacePlaceholders(template, templateData);
    
    return await sendEmail(
      userDetails.email,
      '🎉 Welcome to Fraction - Your Car Sharing Journey Begins!',
      htmlContent
    );
  } catch (error) {
    logger(`Error sending welcome email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// KYC approval email
const sendKycApprovedEmail = async (userDetails) => {
  try {
    const template = readTemplate('kyc-approved');
    
    const templateData = {
      userName: userDetails.name,
      approvedBy: userDetails.kycApprovedBy?.name || 'Fraction Team',
      approvalDate: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dashboardLink: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard`
    };
    
    const htmlContent = replacePlaceholders(template, templateData);
    
    return await sendEmail(
      userDetails.email,
      '✅ KYC Approved - Start Booking Cars Now!',
      htmlContent
    );
  } catch (error) {
    logger(`Error sending KYC approved email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// KYC rejection email
const sendKycRejectedEmail = async (userDetails, rejectionComments) => {
  try {
    const template = readTemplate('kyc-rejected');
    
    const templateData = {
      userName: userDetails.name,
      rejectionDate: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      rejectionComments: rejectionComments || 'Please review and resubmit your documents.',
      kycResubmitLink: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/kyc-verification`
    };
    
    const htmlContent = replacePlaceholders(template, templateData);
    
    return await sendEmail(
      userDetails.email,
      '⚠️ KYC Update Required - Action Needed',
      htmlContent
    );
  } catch (error) {
    logger(`Error sending KYC rejected email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Booking confirmation email
const sendBookingConfirmationEmail = async (userDetails, bookingDetails) => {
  try {
    const template = readTemplate('booking-confirmation');
    
    const templateData = {
      userName: userDetails.name,
      bookingId: bookingDetails.bookingId,
      carName: bookingDetails.carName,
      carModel: bookingDetails.carModel,
      pickupDate: new Date(bookingDetails.pickupDate).toLocaleDateString('en-IN'),
      pickupTime: bookingDetails.pickupTime,
      returnDate: new Date(bookingDetails.returnDate).toLocaleDateString('en-IN'),
      returnTime: bookingDetails.returnTime,
      pickupLocation: bookingDetails.pickupLocation,
      totalAmount: bookingDetails.totalAmount,
      paymentStatus: bookingDetails.paymentStatus || 'Confirmed',
      bookingDetailsLink: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/bookings/${bookingDetails.bookingId}`
    };
    
    const htmlContent = replacePlaceholders(template, templateData);
    
    return await sendEmail(
      userDetails.email,
      `🚗 Booking Confirmed - ${bookingDetails.carName} (${bookingDetails.bookingId})`,
      htmlContent
    );
  } catch (error) {
    logger(`Error sending booking confirmation email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Password reset email (if needed in future)
const sendPasswordResetEmail = async (userDetails, resetToken) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        <p>Dear ${userDetails.name},</p>
        <p>You have requested to reset your password. Click the link below to reset your password:</p>
        <a href="${resetLink}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #7f8c8d; font-size: 14px;">Fraction Team<br>support@fraction.com</p>
      </div>
    `;
    
    return await sendEmail(
      userDetails.email,
      '🔐 Password Reset Request - Fraction',
      htmlContent
    );
  } catch (error) {
    logger(`Error sending password reset email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Email verification email
const sendVerificationEmail = async (userDetails, verificationCode) => {
  try {
    const template = readTemplate('email-verification');
    
    const templateData = {
      userName: userDetails.name,
      verificationCode: verificationCode,
      verificationLink: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify-email?code=${verificationCode}`
    };
    
    const htmlContent = replacePlaceholders(template, templateData);
    
    return await sendEmail(
      userDetails.email,
      '📧 Verify Your Email - Fraction Account',
      htmlContent
    );
  } catch (error) {
    logger(`Error sending verification email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Password reset email
const sendPasswordResetEmailWithCode = async (userDetails, resetCode) => {
  try {
    const template = readTemplate('password-reset');
    
    const now = new Date();
    const templateData = {
      userName: userDetails.name,
      resetCode: resetCode,
      resetLink: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password?code=${resetCode}`,
      requestDate: now.toLocaleDateString('en-IN'),
      requestTime: now.toLocaleTimeString('en-IN')
    };
    
    const htmlContent = replacePlaceholders(template, templateData);
    
    return await sendEmail(
      userDetails.email,
      '🔐 Password Reset Code - Fraction',
      htmlContent
    );
  } catch (error) {
    logger(`Error sending password reset email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Test email function
const sendTestEmail = async (to) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #27ae60;">✅ Email Configuration Test</h2>
        <p>Congratulations! Your email configuration is working correctly.</p>
        <p>This is a test email sent from your Fraction application.</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN')}</p>
        <hr style="margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 14px;">Fraction - Car Sharing Platform</p>
      </div>
    `;
    
    return await sendEmail(
      to,
      '✅ Email Configuration Test - Fraction',
      htmlContent
    );
  } catch (error) {
    logger(`Error sending test email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendKycApprovedEmail,
  sendKycRejectedEmail,
  sendBookingConfirmationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendPasswordResetEmailWithCode,
  sendTestEmail
};
