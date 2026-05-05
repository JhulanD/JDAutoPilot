import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // NOTE: On Vercel, writing to local files (like leads.json) is not persistent.
    // You should use a database like Firestore, Supabase, or a CRM API.
    console.log(`New lead captured (Function):`, lead);

    res.status(200).json({ success: true, message: "Lead captured. Note: Local file storage is not supported on Vercel serverless functions." });
  } catch (error: any) {
    console.error("Error saving lead in Vercel function:", error);
    res.status(500).json({ error: "Failed to save lead" });
  }
}
