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
            <div style="font-family: Arial, sans-serif; max-width: 600px; color: #111;">
              <h1 style="color: #ff4d00;">Your ROI Analysis is Complete.</h1>
              <p>Hello,</p>
              <p>Attached is your personalized automation report. Based on your metrics, you could be saving <strong>${results.hoursSaved} hours per month</strong>.</p>
              <p><strong>Impact:</strong> $${results.annualSavings.toLocaleString()} in annual profit optimization.</p>
              <hr style="border: 1px solid #eee; margin: 30px 0;" />
              <p>Ready to deploy these systems?</p>
              <a href="https://cal.com/jdautopilot/15min" style="background: #ff4d00; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; display: inline-block;">BOOK CUSTOM AUDIT</a>
              <p style="font-size: 12px; color: #666; margin-top: 40px;">&copy; 2026 JDAutoPilot. All Systems Go.</p>
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
            <div style="background-color: #0F1115; color: #FFFFFF; font-family: sans-serif; padding: 40px; text-align: center;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #15171d; border: 1px solid #E6513A; padding: 40px; border-radius: 8px;">
                <h1 style="color: #E6513A; text-transform: uppercase; letter-spacing: 2px;">Vault Unlocked</h1>
                <p style="font-size: 18px; color: #9CA3AF;">Hello ${name || 'Agent'}, the automation blueprints are ready for deployment.</p>
                <div style="margin: 30px 0; padding: 20px; background: rgba(230, 81, 58, 0.1); border-left: 4px solid #E6513A; text-align: left;">
                  <h3 style="color: #FFFFFF; margin-top: 0;">Exclusive Assets:</h3>
                  <ul style="list-style: none; padding: 0; margin: 0; color: #F3F4F6;">
                    <li style="margin-bottom: 15px;">🔥 <strong>1 - Lead Qualifier</strong></li>
                    <li style="margin-bottom: 15px;">🚀 <strong>2 - Telegram Bot Powered Booking</strong></li>
                    <li>🔗 <strong>3 - Webform Automation</strong></li>
                  </ul>
                </div>
                <a href="https://www.notion.so/JDAutoPilot-3496964a0266807d8cb6f61290e02095?source=copy_link" 
                   style="display: inline-block; background-color: #E6513A; color: #FFFFFF; font-weight: bold; text-decoration: none; padding: 15px 30px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
                   ENTER THE VAULT
                </a>
                <p style="margin-top: 30px; font-size: 12px; color: #4B5563;">&copy; 2026 JDAutoPilot. All systems go.</p>
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
