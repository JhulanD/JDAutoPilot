import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html, attachments }: { 
  to: string, 
  subject: string, 
  html: string, 
  attachments?: any[] 
}) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"JDAutoPilot" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    attachments
  });

  return info;
}
