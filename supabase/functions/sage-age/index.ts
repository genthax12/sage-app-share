// SAGE-AGE — computes "years of life saved from screen time" and writes it to the sage_age table.
// Two modes:
//   • Per-user (default): called from the app with the user's bearer token. Recomputes & returns THEIR result.
//   • Cron ("mode":"all"): called weekly by pg_cron with the x-cron-key header. Recomputes EVERY user.
//
// Deploy:  supabase functions deploy sage-age
// Secrets: OPENAI_API_KEY (same key as sage-chat) and CRON_SECRET (any long random string you also
//          store in the DB setting app.sage_cron_key). SUPABASE_URL / SERVICE_ROLE / ANON are auto-provided.

const RAW = (Deno.env.get("OPENAI_API_KEY") || "").trim();
const KM = RAW.match(/sk-[A-Za-z0-9_\-]+/);                 // tolerate a pasted curl snippet
const OPENAI_API_KEY = KM ? KM[0] : RAW;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CRON_SECRET = (Deno.env.get("CRON_SECRET") || "").trim();
const AI_MODEL = "gpt-6-luna";

const WINDOW_DAYS = 35;      // look back this far
const NEED_DAYS = 30;        // days of data required before the number is "ready"
const TARGET_H = 1.6;        // healthy daily baseline (hours)
const WAKING_H = 16;         // waking hours/day → converts saved hours into equivalent life-years

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-cron-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

// ── PostgREST helpers (service role bypasses RLS) ────────────────────────────
const db = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

// ── The math: usage rows → years saved ───────────────────────────────────────
function compute(rows: { day: string; minutes: number }[], age: number | null) {
  const byDay: Record<string, number> = {};
  for (const r of rows) byDay[r.day] = (byDay[r.day] || 0) + Number(r.minutes || 0);
  const days = Object.keys(byDay);
  const daysTracked = days.length;
  const avgHours = daysTracked ? days.reduce((s, d) => s + byDay[d], 0) / daysTracked / 60 : 0;
  const cut = Math.max(0.4, avgHours - TARGET_H);                 // hours/day reclaimed
  const remaining = Math.max(10, 82 - (age ?? 24));              // life-years left
  const years = Math.max(0.5, Math.round((cut * remaining / WAKING_H) * 10) / 10);
  const ready = daysTracked >= NEED_DAYS;
  return {
    avg_hours: Math.round(avgHours * 10) / 10,
    cut_hours: Math.round(cut * 10) / 10,
    days_tracked: daysTracked,
    ready,
    years_saved: ready ? years : null,
  };
}

// ── Optional AI headline (best-effort; failure never blocks the number) ──────
async function headline(c: ReturnType<typeof compute>, name: string | null): Promise<string | null> {
  if (!OPENAI_API_KEY || !c.ready || c.years_saved == null) return null;
  const prompt =
    `Write ONE short, punchy, shareable line (max 14 words) for ${name || "someone"} who is on track to ` +
    `save ${c.years_saved} years of their life by cutting screen time from ${c.avg_hours}h/day toward a ` +
    `healthier ${TARGET_H}h. Warm, a little bold, no hashtags, no quotes. Sign off feeling earned, not preachy.`;
  try {
    const ai = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ model: AI_MODEL, instructions: "You are Sage, a warm screen-time mentor.", input: prompt, max_output_tokens: 60 }),
    });
    if (!ai.ok) return null;
    const d = await ai.json();
    const t = (d.output_text ?? d.output?.[0]?.content?.[0]?.text ?? "").trim();
    return t || null;
  } catch { return null; }
}

// ── Recompute one user and upsert the result ─────────────────────────────────
async function recomputeUser(userId: string, age: number | null, name: string | null) {
  const since = new Date(Date.now() - WINDOW_DAYS * 864e5).toISOString().slice(0, 10);
  const r = await db(`usage_days?user_id=eq.${userId}&day=gte.${since}&select=day,minutes`);
  const rows = r.ok ? await r.json() : [];
  const c = compute(rows, age);
  const line = await headline(c, name);
  const row = { user_id: userId, ...c, headline: line, updated_at: new Date().toISOString() };
  await db("sage_age", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates, return=minimal" },
    body: JSON.stringify(row),
  });
  return row;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));

    // ── Cron / bulk mode ──────────────────────────────────────────────────
    if (body?.mode === "all") {
      if (!CRON_SECRET || req.headers.get("x-cron-key") !== CRON_SECRET)
        return json({ error: "forbidden" }, 403);
      const pr = await db("profiles?select=id,name,age");
      const profiles = pr.ok ? await pr.json() : [];
      let n = 0;
      for (const p of profiles) { await recomputeUser(p.id, p.age ?? null, p.name ?? null); n++; }
      return json({ ok: true, recomputed: n });
    }

    // ── Per-user mode (app) ───────────────────────────────────────────────
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return json({ error: "missing token" }, 401);
    const ures = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!ures.ok) return json({ error: "unauthorized" }, 401);
    const user = await ures.json();
    const pr = await db(`profiles?id=eq.${user.id}&select=name,age`);
    const prof = pr.ok ? (await pr.json())[0] : null;
    const row = await recomputeUser(user.id, prof?.age ?? null, prof?.name ?? null);
    return json(row);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
