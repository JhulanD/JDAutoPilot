import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const status = {
    env: {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      GMAIL_USER: !!process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD,
    },
    timestamp: new Date().toISOString(),
    node_version: process.version,
  };

  return res.status(200).json(status);
}
