import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendEmail } from '../lib/email-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, results, pdf } = req.body;
    
    if (!email || !pdf) {
      return res.status(400).json({ error: "Missing required data" });
    }

    const base64Content = pdf.split(",")[1] || pdf;
    
    const info = await sendEmail({
      to: email,
      subject: "Your Personalized Agency ROI Report - JDAutoPilot",
      html: `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1F2937; line-height: 1.6; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #F9FAFB; padding: 40px; border-bottom: 1px solid #E5E7EB; text-align: center;">
            <h1 style="color: #E6513A; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Your Growth Analysis is Ready</h1>
            <p style="color: #6B7280; font-size: 16px; margin-top: 10px;">JDAutoPilot Agency Automation Insights</p>
          </div>
          
          <div style="padding: 40px;">
            <p style="font-size: 18px;">Hello,</p>
            <p>We've completed the heavy lifting on your Agency ROI analysis. The results are clear: by implementing the automation strategies we've outlined, your agency is positioned to reclaim significant resources.</p>
            
            <div style="background-color: #FFF7ED; border: 1px solid #FFEDD5; border-radius: 8px; padding: 24px; margin: 30px 0;">
              <h3 style="color: #9A3412; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Estimated Monthly Impact</h3>
              <div style="display: flex; gap: 20px;">
                <div style="flex: 1;">
                  <p style="font-size: 32px; font-weight: bold; color: #E6513A; margin: 10px 0 0 0;">${results.hoursSaved}h</p>
                  <p style="font-size: 12px; color: #9A3412; margin: 0;">Time Recovered</p>
                </div>
                <div style="flex: 1;">
                  <p style="font-size: 32px; font-weight: bold; color: #E6513A; margin: 10px 0 0 0;">$${Math.round(results.annualSavings / 12).toLocaleString()}</p>
                  <p style="font-size: 12px; color: #9A3412; margin: 0;">Monthly Savings</p>
                </div>
              </div>
            </div>

            <p><strong>What's inside your report?</strong> We've broken down exactly where your bottlenecks are and how automation will turn those manual hours into billable scale. You'll find the full PDF attached to this email.</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <p style="font-size: 16px; color: #4B5563; margin-bottom: 20px;">Ready to stop managing spreadsheets and start scaling?</p>
              <a href="https://cal.com/jdautopilot/15min" style="background-color: #E6513A; color: #FFFFFF; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 16px;">
                Book a Free Growth Audit
              </a>
            </div>

            <p style="color: #6B7280; font-size: 14px; text-align: center; font-style: italic;">"The best agencies don't work harder, they build better systems." — JDAutoPilot Team</p>
          </div>
          
          <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="font-size: 12px; color: #9CA3AF; margin: 0;">&copy; 2026 JDAutoPilot. Sent with precision for agency founders.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: "JDAutoPilot-ROI-Report.pdf",
          content: base64Content,
          encoding: 'base64'
        }
      ]
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("ROI report error in Vercel function:", error);
    return res.status(500).json({ error: "Failed to process ROI report", details: error.message });
  }
}
