import { createClient } from '@supabase/supabase-js';

let preconnectedOrigin: string | undefined;

function preconnectSupabase(url: string) {
  // index.html cannot know the Supabase host at build time (the env var may be
  // empty), so open the connection as soon as the client is configured.
  try {
    const origin = new URL(url).origin;
    if (preconnectedOrigin === origin || typeof document === 'undefined') return;
    preconnectedOrigin = origin;
    if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = '';
    document.head.appendChild(link);
  } catch {
    // An invalid URL will be rejected by createClient below.
  }
}

export function getSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Chưa cấu hình Supabase. Hãy điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  preconnectSupabase(url);
  return createClient(url, key);
}
