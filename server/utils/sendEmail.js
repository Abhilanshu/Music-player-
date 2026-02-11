const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // For development, we can use a test account or generic SMTP config
    // In production, this should be SendGrid/Mailgun/AWS SES

    // Using Ethereal for testing if no real credentials provided
    // Ideally put credentials in .env

    // Example: Gmail (requires App Password) or SMTP
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or host: process.env.SMTP_HOST...
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const message = {
        from: `${process.env.FROM_NAME || 'InvoicePro'} <${process.env.FROM_EMAIL || 'noreply@invoicepro.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
        attachments: options.attachments
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (err) {
        console.error('Email Error:', err);
        // Don't throw error to prevent crashing, just log
        return null;
    }
};

module.exports = sendEmail;
