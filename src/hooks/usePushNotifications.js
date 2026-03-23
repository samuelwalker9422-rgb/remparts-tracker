import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Fetch VAPID public key from the server (keeps it out of the JS bundle)
let cachedVapidKey = null;
async function getVapidKey() {
  if (cachedVapidKey) return cachedVapidKey;
  const res = await fetch('/api/vapid-key');
  if (!res.ok) throw new Error('Failed to fetch VAPID public key');
  const { publicKey } = await res.json();
  cachedVapidKey = publicKey;
  return publicKey;
}

// Web Push requires the VAPID key as a Uint8Array in URL-safe base64 format
function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64  = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

const PREF_KEY = 'push_notifications_enabled';

// ── Hook ──────────────────────────────────────────────────────────────────────
export function usePushNotifications() {
  const supported =
    typeof window !== 'undefined' &&
    'Notification'    in window &&
    'serviceWorker'   in navigator &&
    'PushManager'     in window;

  const [enabled,  setEnabled]  = useState(() => {
    try { return localStorage.getItem(PREF_KEY) === 'true'; } catch { return false; }
  });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // Register service worker on mount (safe to call multiple times)
  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.register('/sw.js').catch(e =>
      console.warn('[push] SW registration failed:', e.message)
    );
  }, [supported]);

  // ── Enable ─────────────────────────────────────────────────────────────────
  const enable = useCallback(async () => {
    if (!supported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Permission denied — enable notifications in your browser settings');
        setLoading(false);
        return false;
      }

      const reg  = await navigator.serviceWorker.ready;
      const key  = await getVapidKey();
      const sub  = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Not signed in');

      const { error: dbErr } = await supabase
        .from('profiles')
        .upsert({ id: user.id, push_subscription: sub.toJSON() }, { onConflict: 'id' });
      if (dbErr) throw dbErr;

      localStorage.setItem(PREF_KEY, 'true');
      setEnabled(true);
      setLoading(false);
      return true;
    } catch (e) {
      console.error('[push] enable error:', e.message);
      setError(e.message ?? 'Failed to enable notifications');
      setLoading(false);
      return false;
    }
  }, [supported]);

  // ── Disable ────────────────────────────────────────────────────────────────
  const disable = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .upsert({ id: user.id, push_subscription: null }, { onConflict: 'id' });
      }
    } catch (e) {
      console.warn('[push] disable error:', e.message);
    }
    localStorage.removeItem(PREF_KEY);
    setEnabled(false);
  }, []);

  // ── Send ───────────────────────────────────────────────────────────────────
  // Sends a notification to any user by ID via the server-side push endpoint.
  // Silently no-ops when push is disabled locally (avoids hammering the API).
  const notify = useCallback(async (userId, title, body, url = '/') => {
    if (!enabled || !userId) return;
    try {
      await fetch('/api/push-notify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, title, body, url }),
      });
    } catch (e) {
      console.warn('[push] notify error:', e.message);
    }
  }, [enabled]);

  return { supported, enabled, loading, error, enable, disable, notify };
}
