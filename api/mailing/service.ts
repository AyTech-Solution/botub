import nodemailer from 'nodemailer';

/**
 * Mail Service for Botub AI
 * Handles sending notifications, reports, and alerts.
 */

const port = parseInt(process.env.SMTP_PORT || '587');
const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port,
  secure: isSecure, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Better defaults for STARTTLS vs Implicit TLS
    rejectUnauthorized: false
  }
});

export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text?: string, html?: string }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials missing. Please set SMTP_USER and SMTP_PASS in environment variables.');
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER, // Using direct email to avoid alias issues
      to,
      subject,
      text,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
