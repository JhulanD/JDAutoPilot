import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let resendClient: Resend | null = null;
function getResend() {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn("RESEND_API_KEY not configured. ROI report emails will be logged only.");
      return null;
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}

function getNodemailer() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  
  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

async function sendMail({ to, subject, html, attachments }: { to: string, subject: string, html: string, attachments?: any[] }) {
  const transporter = getNodemailer();
  
  if (transporter) {
    console.log(`Attempting to send email via Gmail to: ${to}`);
    try {
      const info = await transporter.sendMail({
        from: `"JDAutoPilot" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
        attachments: attachments?.map(a => ({
          filename: a.filename,
          content: a.content,
        }))
      });
      console.log(`Email sent via Gmail: ${info.messageId}`);
      return { success: true, id: info.messageId };
    } catch (error: any) {
      console.error("Gmail error:", error);
      throw error;
    }
  }

  const resend = getResend();
  if (resend) {
    console.log(`Attempting to send email via Resend to: ${to}`);
    const { data, error } = await resend.emails.send({
      from: "JDAutoPilot <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
      attachments
    });

    if (error) {
      console.error("Resend Error:", error);
      const isValidationError = error.name === 'validation_error';
      const message = isValidationError 
        ? "TESTING LIMIT: When using 'onboarding@resend.dev', you can ONLY send emails to the address you signed up with on Resend. Verify a domain or use Gmail instead."
        : error.message;
      throw { name: error.name, message };
    }

    return { success: true, id: data?.id };
  }

  throw new Error("No email provider configured (Resend or Gmail)");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' })); // Increase limit for PDF data uri

  // API Routes
  app.post("/api/roi-report", async (req, res) => {
    try {
      const { email, metrics, results, pdf } = req.body;
      
      if (!email || !pdf) {
        return res.status(400).json({ error: "Missing required data" });
      }

      console.log(`ROI Report requested for: ${email}`);
      console.log("Metrics:", metrics);
      console.log("Results:", results);

      // Handled by unified sendMail function
      const base64Content = pdf.split(",")[1] || pdf;
      
      try {
        const result = await sendMail({
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
              content: Buffer.from(base64Content, 'base64'),
            }
          ]
        });

        console.log(`ROI Report successfully sent to ${email}. ID: ${result.id}`);
      } catch (err: any) {
        console.error("Email processing failed:", err);
        return res.status(err.name === 'validation_error' ? 422 : 500).json({ 
          error: err.message || "Failed to send email",
          code: err.name,
          details: err 
        });
      }

      // Also save as a lead
      const leadsFile = path.join(__dirname, 'leads.json');
      let leads = [];
      try {
        const data = await fs.readFile(leadsFile, 'utf-8');
        leads = JSON.parse(data);
      } catch (e) {}
      leads.push({ email, type: 'roi_report', metrics, results, timestamp: new Date().toISOString() });
      await fs.writeFile(leadsFile, JSON.stringify(leads, null, 2));

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error processing ROI report:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const { name, email, source } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const lead = {
        name,
        email,
        source: source || 'unknown',
        timestamp: new Date().toISOString()
      };

      // For now, we'll append to a local JSON file as a lightweight database
      // In a production environment, you would use Firebase, Supabase, or a CRM API here
      const leadsFile = path.join(__dirname, 'leads.json');
      let leads = [];
      
      try {
        const data = await fs.readFile(leadsFile, 'utf-8');
        leads = JSON.parse(data);
      } catch (e) {
        // File doesn't exist yet
      }

      leads.push(lead);
      await fs.writeFile(leadsFile, JSON.stringify(leads, null, 2));

      console.log(`New lead captured: ${email} via ${source}`);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error saving lead:", error);
      res.status(500).json({ error: "Failed to save lead" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/send-vault-access", async (req, res) => {
    try {
      const { email, name } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      try {
        const result = await sendMail({
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

        console.log(`Vault access email successfully sent to ${email}. ID: ${result.id}`);
      } catch (err: any) {
        console.error("Vault access email failed:", err);
        return res.status(err.name === 'validation_error' ? 422 : 500).json({ 
          error: err.message || "Failed to send email",
          code: err.name,
          details: err 
        });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error sending vault access:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
