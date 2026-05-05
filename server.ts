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
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #ffffff; line-height: 1.6; border: 1px solid #333; border-radius: 12px; overflow: hidden; background-color: #000000;">
              <div style="background-color: #111111; padding: 30px; text-align: center; border-bottom: 1px solid #E6513A;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">ROI Analysis Complete</h1>
              </div>
              <div style="padding: 40px;">
                <p style="font-size: 18px; margin-top: 0; color: #ffffff;">Hey there,</p>
                <p style="color: #9CA3AF;">I've just finished crunching the numbers for your agency, and the results are eye-opening. Your current manual overhead is costing you significantly more than it should.</p>
                
                <div style="background-color: #111111; border-left: 4px solid #E6513A; padding: 25px; margin: 30px 0; border-radius: 4px; box-shadow: 0 4px 20px rgba(230, 81, 58, 0.1);">
                  <p style="margin: 0; font-size: 17px; color: #ffffff;">
                    🎯 <strong style="color: #E6513A;">Potential Savings:</strong> ${results.hoursSaved} hours/month<br>
                    💰 <strong style="color: #E6513A;">Annual Profit Recovery:</strong> $${results.annualSavings.toLocaleString()}
                  </p>
                </div>

                <p style="color: #9CA3AF;">I've attached the full breakdown in a PDF for you. It covers exactly where the "leaks" are in your operations and how AI-driven logic can plug them immediately.</p>
                
                <p style="color: #ffffff; font-weight: 500;">This isn't just about saving time; it's about scaling your talent.</p>
                
                <div style="text-align: center; margin: 45px 0;">
                  <a href="https://cal.com/jdautopilot/15min" style="background-color: #E6513A; color: #ffffff; padding: 18px 36px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 16px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
                    Claim Your Custom Growth Audit
                  </a>
                  <p style="font-size: 14px; color: #666; margin-top: 15px;">(15 minutes could save you 15 hours a week)</p>
                </div>

                <p style="color: #9CA3AF;">Looking forward to seeing your agency hit that next gear.</p>
                <p style="margin-bottom: 0; color: #ffffff;">Best,</p>
                <p style="font-weight: bold; color: #E6513A; margin-top: 5px;">JD<br><span style="font-size: 12px; font-weight: normal; color: #666;">Founder, JDAutoPilot</span></p>
              </div>
              <div style="background-color: #080808; padding: 25px; text-align: center; font-size: 11px; color: #444; border-top: 1px solid #222;">
                <p style="margin: 0;">&copy; 2026 JDAutoPilot. Built for those who scale with logic.</p>
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

      // Also save as a lead - wrapped in try/catch to prevent server crashes on read-only filesystems (like Vercel)
      try {
        const leadsFile = path.join(__dirname, 'leads.json');
        let leads = [];
        try {
          const data = await fs.readFile(leadsFile, 'utf-8');
          leads = JSON.parse(data);
        } catch (e) {}
        leads.push({ email, type: 'roi_report', metrics, results, timestamp: new Date().toISOString() });
        await fs.writeFile(leadsFile, JSON.stringify(leads, null, 2));
      } catch (saveError) {
        console.warn("Could not save lead to local file (Normal on Vercel):", saveError);
      }

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
      try {
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
      } catch (saveError) {
        console.warn("Could not save lead locally (Normal on Vercel):", saveError);
      }

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
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #ffffff; line-height: 1.6; border: 1px solid #333; border-radius: 12px; overflow: hidden; background-color: #000000;">
              <div style="background-color: #111111; padding: 30px; text-align: center; border-bottom: 1px solid #E6513A;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Vault Unlocked</h1>
              </div>
              <div style="padding: 40px;">
                <p style="font-size: 18px; margin-top: 0; color: #ffffff;">Welcome to the inner circle, ${name || 'Lead'}!</p>
                <p style="color: #9CA3AF;">You've just taken the first step toward reclaiming your time and scaling your agency with pure logic. The automation blueprints you requested are ready and waiting for you.</p>
                
                <p style="color: #9CA3AF;">These are the exact same systems we use to power high-intensity operations, designed for speed and reliability. No fluff—just functional scaling logic.</p>

                <div style="margin: 30px 0; padding: 25px; background-color: #111111; border-left: 4px solid #E6513A; border-radius: 4px; box-shadow: 0 4px 20px rgba(230, 81, 58, 0.1);">
                  <h3 style="color: #E6513A; margin-top: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Your Ready-to-Deploy Assets:</h3>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin-bottom: 12px; font-size: 15px; color: #ffffff;">🔥 <strong style="color: #E6513A;">01:</strong> Lead Qualifier – Instant intake screening.</li>
                    <li style="margin-bottom: 12px; font-size: 15px; color: #ffffff;">🚀 <strong style="color: #E6513A;">02:</strong> Telegram Booking Bot – High-speed capture.</li>
                    <li style="font-size: 15px; color: #ffffff;">🔗 <strong style="color: #E6513A;">03:</strong> Webform Blueprint – Seamless integration.</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                  <a href="https://www.notion.so/JDAutoPilot-3496964a0266807d8cb6f61290e02095?source=copy_link" 
                     style="background-color: #E6513A; color: #ffffff; padding: 18px 36px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 18px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
                     ENTER THE VAULT
                  </a>
                  <p style="font-size: 13px; color: #444; margin-top: 15px;">Note: You may need a Notion account to duplicate templates.</p>
                </div>

                <p style="color: #9CA3AF;">If you have any questions while setting these up, or if you want us to build something custom for your workflow, just hit reply or book a quick strategy session below.</p>
                
                <p style="text-align: center;"><a href="https://cal.com/jdautopilot/15min" style="color: #E6513A; font-weight: bold; text-decoration: underline;">Book a 15-Min Strategy Session</a></p>

                <p style="margin-top: 40px; margin-bottom: 0; color: #ffffff;">See you on the inside,</p>
                <p style="font-weight: bold; color: #E6513A; margin-top: 5px;">JD<br><span style="font-size: 12px; font-weight: normal; color: #666;">Founder, JDAutoPilot</span></p>
              </div>
              <div style="background-color: #080808; padding: 25px; text-align: center; font-size: 11px; color: #444; border-top: 1px solid #222;">
                <p style="margin: 0;">&copy; 2026 JDAutoPilot. Built for those who scale with logic.</p>
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
    const distPath = path.join(process.cwd(), 'dist');
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
