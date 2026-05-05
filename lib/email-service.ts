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
    const missing = [];
    if (!user) missing.push("GMAIL_USER");
    if (!pass) missing.push("GMAIL_APP_PASSWORD");
    console.error(`CRITICAL: Missing environment variables: ${missing.join(", ")}`);
    throw new Error(`Email configuration missing on server: ${missing.join(", ")}`);
  }

  console.log(`[EmailService] Attempting to send email to: ${to}`);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s/g, ''), // Remove potential spaces in app password
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"JDAutoPilot" <${user.trim()}>`,
      to: to.trim(),
      subject,
      html,
      attachments
    });

    console.log(`[EmailService] Success! MessageID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("[EmailService] Error Details:", error);
    throw error;
  }
}
