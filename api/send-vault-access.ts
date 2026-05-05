import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendEmail } from '../lib/email-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const info = await sendEmail({
      to: email,
      subject: "ACCESS GRANTED: Your Agency AI Vault",
      html: `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1F2937; line-height: 1.6; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #F9FAFB; padding: 40px; border-bottom: 1px solid #E5E7EB; text-align: center;">
            <h1 style="color: #E6513A; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Vault Access Granted</h1>
            <p style="color: #6B7280; font-size: 16px; margin-top: 10px;">Welcome to the JDAutoPilot Inner Circle</p>
          </div>
          
          <div style="padding: 40px;">
            <p style="font-size: 18px;">Hi ${name || 'Agent'},</p>
            <p>Welcome to the vault. You now have access to the exact blueprint we use to optimize high-intensity agency operations. These aren't just "ideas"—they are ready-to-deploy logic structures designed to remove you from the day-to-day grind.</p>
            
            <div style="margin: 30px 0; padding: 24px; background: #FFF7ED; border-left: 4px solid #E6513A; border-radius: 0 8px 8px 0;">
              <h3 style="color: #9A3412; margin-top: 0; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">Your Private Assets:</h3>
              <div style="margin-top: 15px;">
                <div style="margin-bottom: 12px; border-bottom: 1px solid rgba(230, 81, 58, 0.1); padding-bottom: 8px;">
                  <span style="font-size: 18px;">🔥</span> <strong>Lead Qualifier:</strong> Stop wasting time on low-value prospects.
                </div>
                <div style="margin-bottom: 12px; border-bottom: 1px solid rgba(230, 81, 58, 0.1); padding-bottom: 8px;">
                  <span style="font-size: 18px;">🚀</span> <strong>Telegram Booking:</strong> Instant notifications and scheduling on the go.
                </div>
                <div>
                  <span style="font-size: 18px;">🔗</span> <strong>Webform Logic:</strong> Seamless data flows from inquiry to delivery.
                </div>
              </div>
            </div>

            <p>We've hosted these assets in a dedicated Notion workspace so you can duplicate them directly into your workflow today.</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://www.notion.so/JDAutoPilot-3496964a0266807d8cb6f61290e02095?source=copy_link" 
                 style="display: inline-block; background-color: #E6513A; color: #FFFFFF; font-weight: bold; text-decoration: none; padding: 18px 36px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px; font-size: 16px;">
                 Enter the AI Vault
              </a>
            </div>

            <p style="color: #4B5563; font-size: 15px;"><strong>Pro Tip:</strong> Duplicate these into your own Notion first, then walk through the documentation we've included for each template. If you get stuck, we're just an email away.</p>
          </div>
          
          <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="font-size: 12px; color: #9CA3AF; margin: 0;">&copy; 2026 JDAutoPilot. Optimization is an obsession.</p>
          </div>
        </div>
      `
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("Vault access error in Vercel function:", error);
    return res.status(500).json({ error: "Failed to send vault access", details: error.message });
  }
}
