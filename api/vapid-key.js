// Returns the VAPID public key so the client can subscribe to push notifications.
// The public key is safe to expose — it's designed to be public.

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return res.status(500).json({ error: 'VAPID_PUBLIC_KEY not configured' });
  return res.status(200).json({ publicKey: key });
}
