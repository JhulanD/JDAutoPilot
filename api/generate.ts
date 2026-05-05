import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    const userPrompt = payload.prompt as string;
    const historyArray = (payload.history || []) as any[];
    
    if (!userPrompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY is not set in process.env");
      return res.status(500).json({ error: "Gemini API key not configured on server." });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    
    // Process and validate history
    const contents = [...historyArray, { role: "user", parts: [{ text: userPrompt }] }];
    
    console.log(`[ChatbotAPI] Sending prompt to Gemini: ${userPrompt.substring(0, 50)}...`);

    const response = await ai.models.generateContent({ 
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: "You are a charismatic and high-energy AI Automation Assistant for JDAutoPilot. Your mission is to show users how AI can explode their agency's productivity and revenue. \n\nGuidelines:\n1. Be varied in your approach—sometimes focus on time-saving, other times on scalability or technical edge.\n2. Always mention the 'Agency AI Growth Vault' as the ultimate treasure trove for templates.\n3. If someone says 'hello' or 'hi', reply with a punchy, unique greeting and ask a specific question about their agency.\n4. Keep responses concise but impactful. \n5. Use tech-forward language but keep it accessible."
      }
    });
    
    const responseText = response.text || "I'm sorry, I couldn't process that.";
    
    return res.status(200).json({ text: responseText });
  } catch (error: any) {
    console.error("Gemini API error in Vercel function:", error);
    return res.status(500).json({ error: "Failed to generate content", details: error.message });
  }
}
