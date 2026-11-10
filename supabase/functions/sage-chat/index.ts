// SAGE — AI mentor proxy (Supabase Edge Function, Deno).
// The OpenAI key lives ONLY here as a secret, never in the app. Every request is authenticated
// with the caller's Supabase session, so only signed-in users can reach the model.
//
// Deploy:   supabase functions deploy sage-chat
// Secrets:  supabase secrets set OPENAI_API_KEY=sk-...   (SUPABASE_URL / SUPABASE_ANON_KEY are provided automatically)

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const AI_MODEL = "gpt-4o-mini";

const PERSONA =
  "You are Sage, a warm screen-time mentor inside the SAGE app. Ethos: 'mentor, not cop' — you coach and encourage, you never shame or lecture. Be concise (2-4 short sentences), human, specific and kind. Ground what you say in the user's real usage when it's provided. Never give medical advice; for real distress, gently suggest talking to someone they trust.";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    // 1) Verify the caller's Supabase session.
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return json({ error: "missing token" }, 401);
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) return json({ error: "unauthorized" }, 401);

    // 2) Build the prompt from the request.
    const { userText, context } = await req.json();
    if (!userText || typeof userText !== "string") return json({ error: "userText required" }, 400);
    const sys = PERSONA + (context ? "\n\nUser's current screen-time context: " + JSON.stringify(context) : "");

    // 3) Call OpenAI with the server-side key.
    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 220,
        temperature: 0.7,
        messages: [{ role: "system", content: sys }, { role: "user", content: userText.slice(0, 2000) }],
      }),
    });
    if (!ai.ok) return json({ error: "ai_error", detail: await ai.text() }, 502);
    const data = await ai.json();
    const text = (data?.choices?.[0]?.message?.content || "").trim();
    return json({ text });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
