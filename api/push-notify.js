// Sends a Web Push notification to a specific user.
// Required env vars:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import webPush from 'web-push';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCors(res) {
  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { userId, title, body, url } = req.body ?? {};
  if (!userId || !title) return res.status(400).json({ error: 'userId and title required' });

  // ── VAPID config ────────────────────────────────────────────────────────────
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
    return res.status(500).json({ error: 'VAPID keys not configured' });
  }
  webPush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  // ── Fetch push subscription from Supabase (service role bypasses RLS) ───────
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured' });
  }

  let subscription;
  try {
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=push_subscription`,
      {
        headers: {
          apikey:        SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (!profileRes.ok) throw new Error(`Supabase ${profileRes.status}`);
    const rows = await profileRes.json();
    subscription = rows[0]?.push_subscription;
  } catch (e) {
    return res.status(502).json({ error: `Failed to fetch subscription: ${e.message}` });
  }

  if (!subscription) return res.status(204).end(); // no subscription — not an error

  // ── Send push ───────────────────────────────────────────────────────────────
  try {
    await webPush.sendNotification(subscription, JSON.stringify({ title, body, url: url ?? '/' }));
    return res.status(200).json({ ok: true });
  } catch (err) {
    // Subscription expired or invalid — clear it from the DB so we stop trying
    if (err.statusCode === 410 || err.statusCode === 404) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
        {
          method:  'PATCH',
          headers: {
            apikey:          SUPABASE_SERVICE_ROLE_KEY,
            Authorization:   `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ push_subscription: null }),
        }
      ).catch(() => {});
      return res.status(410).json({ error: 'Subscription expired — cleared' });
    }
    console.error('webPush.sendNotification error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
