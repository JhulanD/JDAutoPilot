import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendEmail } from '../lib/email-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, text, html, attachments } = req.body;

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log(`[SendEmailAPI] Generic email request to: ${to}`);
    const info = await sendEmail({
      to: typeof to === 'string' ? to.trim() : to,
      subject,
      html: html || text,
      attachments: attachments?.map((a: any) => ({
        filename: a.filename,
        content: a.content,
        encoding: a.encoding || 'base64'
      }))
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}
