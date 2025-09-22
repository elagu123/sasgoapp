import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CSRF cookie (simplified for demo)
  res.setHeader('Set-Cookie', [
    'csrf-token=demo-csrf-token; HttpOnly; Secure; SameSite=Strict; Path=/',
  ]);

  return res.status(200).json({ message: 'CSRF token set' });
}