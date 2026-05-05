import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html, attachments }: { 
  to: string, 
  subject: string, 
  html: string, 
  attachments?: any[] 
}) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.error("CRITICAL: GMAIL_USER or GMAIL_APP_PASSWORD not set in environment.");
    throw new Error("Email configuration missing on server.");
  }

  console.log(`Attempting to send email to ${to} via ${user}...`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"JDAutoPilot" <${user}>`,
      to,
      subject,
      html,
      attachments
    });

    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Nodemailer transport error:", error);
    throw error;
  }
}
