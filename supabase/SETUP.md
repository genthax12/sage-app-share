# SAGE backend — setup (Supabase)

This stands up real account auth and a secure AI proxy. The OpenAI key lives only on the server.
One-time setup, ~20 minutes. You need: a Supabase account (free), an OpenAI API key, and the Supabase CLI.

## 1. Create the project
1. Go to https://supabase.com → **New project**. Name it `sage`, pick a region near your users, set a strong DB password.
2. When it's ready, open **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **anon public** key

## 2. Create the database
1. In the dashboard: **SQL Editor → New query**.
2. Paste the contents of `supabase/schema.sql` and click **Run**. You should see "Success".

## 3. Turn on auth providers
1. **Authentication → Providers → Email**: enable it. For fastest testing, turn **"Confirm email" OFF** (turn it back on before launch).
2. **Sign in with Apple** (required by Apple if you offer any social login): **Authentication → Providers → Apple**, enable, and follow the fields using your Apple Developer account. (Can be done later; email works now.)

## 4. Deploy the AI proxy (Edge Function)
Install the CLI if needed, then from the repo root:

```bash
npm install -g supabase            # if you don't have it
supabase login                     # opens the browser
supabase link --project-ref <your-project-ref>   # the ref is in your project URL
supabase secrets set OPENAI_API_KEY=sk-your-openai-key
supabase functions deploy sage-chat
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically — you only set the OpenAI key.

Your function URL will be: `https://<project-ref>.functions.supabase.co/sage-chat`

## 5. Point the app at the backend
In `App.js`, near the top, fill in the config block:

```js
const SUPABASE_URL = 'https://<project-ref>.supabase.co';
const SUPABASE_ANON_KEY = '<your anon public key>';
const BACKEND_READY = true;   // flips the app from demo to real auth + real AI
```

That's it. With `BACKEND_READY = true`:
- The app shows a real **sign-up / sign-in** screen on launch.
- "Ask Sage" and the per-app chats call your Edge Function (authenticated), which calls OpenAI.
- With `BACKEND_READY = false` (default), the app runs as the offline demo with the local coach — nothing breaks.

## 6. (Later) feed real Screen Time data
Once the DeviceActivity integration lands (phase 3), the app will upsert daily usage into `usage_days`,
and the mentor prompts will read from it. The table + security are already in place.

## Cost
- Supabase free tier is plenty to start.
- OpenAI `gpt-4o-mini` is ~$0.15 / 1M input tokens — on the order of a few cents per thousand chats.
- Add simple per-user rate limits in the Edge Function before launch to cap abuse.

## 7. SAGE-AGE — "years of life saved" (live, weekly refresh)
This feature computes how many years a user is on pace to reclaim from screen time, refreshed
automatically every Sunday. It has its own table, Edge Function, and cron job.

**a) Create the table + schedule.** In SQL Editor, paste and Run `supabase/sage-age.sql`.
It adds the `sage_age` table (RLS: users read only their own row), an optional `profiles.age`
column, enables `pg_cron` + `pg_net`, and schedules `sage-age-weekly` for 08:00 UTC Sundays.

**b) Set two function secrets.**
```bash
supabase secrets set CRON_SECRET=<any long random string>
# OPENAI_API_KEY is already set from step 4 — sage-age reuses it for the shareable headline.
supabase functions deploy sage-age
```

**c) Tell the cron job where to POST (one time).** In SQL Editor, run (persist across restarts):
```sql
alter database postgres set app.sage_fn_url   = 'https://<project-ref>.supabase.co/functions/v1/sage-age';
alter database postgres set app.sage_cron_key = '<same value as CRON_SECRET>';
```

That's it. The app calls `sage-age` on opening the SAGE-AGE tab (recomputes from the user's real
`usage_days`), and the Sunday cron recomputes everyone so the number is always fresh. Until a user
has 30 days of data, the tab shows the "almost there" progress ring; after that, the pulsing years.
