import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _ready = false;
const _readyCallbacks: Array<() => void> = [];

async function tryFetchConfig(): Promise<{ supabaseUrl: string; supabaseAnonKey: string } | null> {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) return null;
    const data = await res.json();
    if (!data.supabaseUrl || !data.supabaseAnonKey) return null;
    return data;
  } catch {
    return null;
  }
}

async function initWithRetry(): Promise<void> {
  // Keep retrying every 800ms until successful — handles server restarts gracefully
  while (true) {
    const config = await tryFetchConfig();
    if (config) {
      _client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });
      _ready = true;
      _readyCallbacks.forEach(cb => cb());
      return;
    }
    await new Promise(r => setTimeout(r, 800));
  }
}

export const initPromise: Promise<void> = initWithRetry();

export function getSupabase(): SupabaseClient {
  if (!_client) throw new Error("Supabase client not yet initialized");
  return _client;
}

export function isReady(): boolean {
  return _ready;
}

export function onReady(cb: () => void): void {
  if (_ready) cb();
  else _readyCallbacks.push(cb);
}
