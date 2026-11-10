import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef, useEffect } from 'react';
import { Text, View, Pressable, TextInput, Animated, Vibration, Easing, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Image, Linking, PanResponder, Share, Alert } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, RadialGradient, Stop, Polygon, Ellipse } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';

// ─────────────────────────────────────────────────────────────────────────────
// SAGE · v9 — minimalist redesign
// One clean signature theme (charcoal / gold / cream), the signature S woven
// throughout, an Apple-smooth one-time onboarding, and a Whoop-style puck
// connection guide. All v8 features kept, just decongested. v8 saved as
// App.v8-backup.js.
// ─────────────────────────────────────────────────────────────────────────────

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TOP = Platform.OS === 'ios' ? 56 : 34;
const S_LOGO = 'M67 29 q-25 -9 -25 10 q0 15 16.5 15 q16.5 0 16.5 15 q0 19 -27 8.5';
const IMG = {
  forest: require('./assets/forest-header.png'),
  welcome: require('./assets/welcome-bg.png'),
  breathe: require('./assets/breathe-bg.png'),
  puck: require('./assets/puck-real.png'),
  home: require('./assets/home-bg.png'),
  pond: require('./assets/trends-pond.png'),
  circle: require('./assets/circle-bg.png'),
};

// ── Themes ───────────────────────────────────────────────────────────────────
const THEMES = {
  sage:  { key: 'sage',  bg: '#1E201B', bg2: '#171814', card: '#26281F', line: '#34372B', text: '#F5F2EA', sub: '#A29E90', gold: '#C7A24E', goldSoft: '#E0C079', good: '#8FB27A', bad: '#CE8159', dark: true,  label: 'Sage' },
  cream: { key: 'cream', bg: '#F5F2EA', bg2: '#ECE7D9', card: '#FFFFFF', line: '#E3DDCC', text: '#1E201B', sub: '#847E6E', gold: '#A9812E', goldSoft: '#C7A24E', good: '#5E8A4E', bad: '#B4623C', dark: false, label: 'Cream' },
  night: { key: 'night', bg: '#111210', bg2: '#0B0C0A', card: '#191A15', line: '#282A21', text: '#F5F2EA', sub: '#989488', gold: '#C7A24E', goldSoft: '#E0C079', good: '#8FB27A', bad: '#CE8159', dark: true, label: 'Midnight' },
  life:  { key: 'life',  bg: '#12211A', bg2: '#0C1712', card: '#193025', line: '#2A4534', text: '#F0F7F1', sub: '#93B6A1', gold: '#F5B53C', goldSoft: '#FFD277', good: '#3FD98A', bad: '#FF6F61', dark: true, label: 'Life', lively: true },
};
let T = THEMES.sage;
const APPS = ['Instagram', 'TikTok', 'YouTube', 'Snapchat', 'X', 'Reddit', 'Facebook', 'Discord', 'Netflix', 'Twitch', 'WhatsApp', 'Messages', 'Mail', 'Slack', 'Safari', 'Chrome', 'Spotify', 'Maps', 'Notion', 'LinkedIn', 'Pinterest', 'Amazon'];

// ── Copy / data (kept from v8, trimmed) ──────────────────────────────────────
const MENTOR = [
  'Nothing new is down there.', 'The feed can wait.', 'Boredom passes in about 90 seconds.',
  'You reached before you decided.', 'Attention is the asset. Guard it.', 'The pause is the power.',
  'Win the night, own the morning.', 'Real rest has no autoplay.', 'Enough is a full sentence.',
  'Your future self is watching.', 'Quiet hands, quiet mind.', 'The scroll never satisfies.',
  'One breath buys back the hour.', 'Stillness is a skill. Train it.', 'Closing it is a flex.',
  'Presence beats scrolling.', 'The urge peaks, then dies.', 'Look up. That’s the app.',
  'Ten minutes for ten years.', 'You set the line.', 'Cravings lie. Clocks don’t.',
  'The best posts are outside.', 'Calm is an edge.', 'Keep the streak breathing.',
];
const COACH = [
  'Try one phone-free meal today — the easiest 30 minutes you’ll reclaim.',
  'Charge your phone outside the bedroom tonight.',
  '9–10 PM is your danger hour. Put something real there first.',
  'Turn on grayscale for an evening. Color is half the craving.',
  'Streak feeling shaky? Tell your Circle. Public streaks last twice as long.',
];
const URGE = ['Bored', 'No reason', 'Doomscrolling', 'A real need'];
const URGE_MSG = {
  'Bored': 'Bored is the brain asking for anything real. Boredom peaks, then passes — about 90 seconds.',
  'No reason': 'The hand moved before the mind did. No reason in, no reward out.',
  'Doomscrolling': 'The feed scrolls you. Every scroll, a minute off your one life.',
  'A real need': 'Real need? Handle it — in, out, done. Mark it essential in Settings if it’s daily.',
};
const TRACKERS = [
  { id: 'focus',   label: 'Longest focus', value: '2h 14m', good: true,  desc: 'Your longest unbroken stretch away from the feed today. Athletes call it flow — you call it Tuesday.' },
  { id: 'pickups', label: 'Pickups',       value: '38',     good: false, desc: 'Times you woke the phone today. Fewer pickups, calmer mind. Down 12% from last week.' },
  { id: 'wind',    label: 'Wind-down',     value: '82',     good: true,  desc: 'How gently you left the screen before sleep last night. Higher is better rest.' },
  { id: 'first',   label: 'First hour',    value: 'Clean',  good: true,  desc: 'Whether your first waking hour stayed phone-free. Owning the morning owns the day.' },
];
const BADGES = [
  { name: 'First Leaf', how: '1 clean day', now: 1, goal: 1 },
  { name: 'Sprout', how: '3-day streak', now: 3, goal: 3 },
  { name: 'Sapling', how: '7-day streak', now: 7, goal: 7 },
  { name: 'Two Weeks', how: '14-day streak', now: 12, goal: 14 },
  { name: 'Grove', how: '30-day streak', now: 12, goal: 30 },
  { name: 'Deep Roots', how: '75 days — habit built', now: 12, goal: 75 },
  { name: 'Night Tamed', how: '7 clean nights', now: 7, goal: 7 },
  { name: 'Clean Sweep', how: '7 days under limit', now: 4, goal: 7 },
  { name: 'Recruiter', how: 'Bring 3 to your Circle', now: 1, goal: 3 },
];
const RANKS = [['Seedling', 0], ['Sprout', 100], ['Sapling', 250], ['Grove Keeper', 500], ['Elder', 1000], ['Sage', 2500]];
const POINTS = 12 * 10 + BADGES.filter(b => b.now >= b.goal).length * 25;
const rankNow = RANKS.filter(r => POINTS >= r[1]).pop();
const rankNext = RANKS.find(r => POINTS < r[1]);
const CIRCLE = [
  { name: 'You', streak: 12, under: true, hrs: 1.6, limit: 2, week: [1.4, 2.1, 1.1, 2.6, 1.8, 0.9, 1.6], focus: '2h 14m', pickups: 38, apps: [['Instagram', 0.7], ['YouTube', 0.4], ['Messages', 0.3], ['Safari', 0.2]] },
  { name: 'Maya', streak: 8, under: true, hrs: 1.2, limit: 1.5, week: [1.0, 1.4, 0.8, 1.6, 1.2, 1.1, 1.2], focus: '3h 02m', pickups: 24, apps: [['TikTok', 0.5], ['Snapchat', 0.3], ['Spotify', 0.2], ['Messages', 0.2]] },
  { name: 'Sam', streak: 21, under: true, hrs: 0.9, limit: 1.5, week: [0.8, 1.1, 0.6, 0.9, 1.0, 0.7, 0.9], focus: '4h 10m', pickups: 16, apps: [['YouTube', 0.3], ['Reddit', 0.2], ['Notion', 0.2], ['Mail', 0.2]] },
  { name: 'Dad', streak: 3, under: false, hrs: 3.4, limit: 2.5, week: [3.1, 3.8, 2.9, 4.2, 3.6, 3.0, 3.4], focus: '0h 46m', pickups: 71, apps: [['Facebook', 1.2], ['YouTube', 0.9], ['Mail', 0.7], ['Safari', 0.6]] },
];
const WEEK = [1.4, 2.1, 1.1, 2.6, 1.8, 0.9, 1.6];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
// Pillar scores are COMPUTED from the raw metrics below, so each score always matches its own breakdown.
const _clamp01 = (x) => Math.max(0, Math.min(1, x));
const _minToH = (m) => { const h = Math.floor(m / 60), mm = m % 60; return mm ? `${h}h ${mm}m` : `${h}h`; };
const PILLAR_RAW = {
  focus:   { longestMin: 134, sessions: 5, brokenBy: 'Instagram', bestWindow: '9–11 AM' },
  sleep:   { phoneDown: '11:02 PM', lastScroll: '11:00 PM', inBedMin: 22, firstPickup: '7:38 AM', lastScrollLate: true },
  balance: { pickups: 38, longestFreeMin: 185, screenFreeEves: 4, phoneFreeMeals: 2 },
};
// Focus: 60% longest unbroken stretch (target 3h) + 40% number of focus sessions (target 6).
const _focusScore = Math.round(60 * _clamp01(PILLAR_RAW.focus.longestMin / 180) + 40 * _clamp01(PILLAR_RAW.focus.sessions / 6));
// Sleep: starts at 100, loses 1.2 pts per minute on the phone in bed, and 10 if the last scroll was after 10:30 PM.
const _sleepScore = Math.round(Math.max(0, 100 - PILLAR_RAW.sleep.inBedMin * 1.2 - (PILLAR_RAW.sleep.lastScrollLate ? 10 : 0)));
// Balance: 50% fewer pickups (penalty above 20) + 30% screen-free evenings (of 7) + 20% longest phone-free stretch (target 3h).
const _balanceScore = Math.round(
  50 * _clamp01(1 - Math.max(0, PILLAR_RAW.balance.pickups - 20) / 40) +
  30 * _clamp01(PILLAR_RAW.balance.screenFreeEves / 7) +
  20 * _clamp01(PILLAR_RAW.balance.longestFreeMin / 180)
);
const PILLARS = {
  focus:   { label: 'Focus',   score: _focusScore,   accent: '#C7A24E', line: 'Your deepest work windows today.', rows: [['Longest focus', _minToH(PILLAR_RAW.focus.longestMin)], ['Focus sessions', String(PILLAR_RAW.focus.sessions)], ['Most broken by', PILLAR_RAW.focus.brokenBy], ['Best window', PILLAR_RAW.focus.bestWindow]] },
  sleep:   { label: 'Sleep',   score: _sleepScore,   accent: '#6FA8D6', line: 'How the phone treated your night.', rows: [['Phone down', PILLAR_RAW.sleep.phoneDown], ['Last scroll', PILLAR_RAW.sleep.lastScroll], ['On phone in bed', PILLAR_RAW.sleep.inBedMin + ' min'], ['First pickup', PILLAR_RAW.sleep.firstPickup]] },
  balance: { label: 'Balance', score: _balanceScore, accent: '#5FBF8A', line: 'Life you lived off the screen.', rows: [['Pickups', String(PILLAR_RAW.balance.pickups)], ['Longest phone-free', _minToH(PILLAR_RAW.balance.longestFreeMin)], ['Screen-free evenings', PILLAR_RAW.balance.screenFreeEves + ' / 7'], ['Phone-free meals', String(PILLAR_RAW.balance.phoneFreeMeals)]] },
};
const BRAND = { Instagram: '#E1306C', TikTok: '#25F4EE', YouTube: '#FF0000', Snapchat: '#F7D000', X: '#1D9BF0', Reddit: '#FF4500', Facebook: '#1877F2', Discord: '#5865F2', Netflix: '#E50914', Twitch: '#9146FF', WhatsApp: '#25D366', Spotify: '#1DB954', Safari: '#1B88F4', Chrome: '#4285F4', LinkedIn: '#0A66C2', Pinterest: '#E60023', Amazon: '#FF9900', Messages: '#34C759', Mail: '#1B88F4', Slack: '#611F69', Maps: '#34A853', Notion: '#B8B8B8' };
const DISTRACTING = [['Instagram', 1.1], ['TikTok', 0.7], ['YouTube', 0.5], ['Reddit', 0.3]];
// Full-phone tracking: every app's time. d = hrs today, w = this week, m = this month.
// necessity:true → shown in Trends but NEVER nudged to cut down. memo = AI-personalized note.
const APP_USAGE = [
  { name: 'Instagram', cat: 'Social', d: 1.1, w: 7.4, m: 31.5, memo: "Built to pull you back in. Tighten this one first — a 45-min cap is a strong start." },
  { name: 'TikTok', cat: 'Social', d: 0.8, w: 5.6, m: 24.0, memo: "The feed is endless on purpose. Give yourself one hard stop a day." },
  { name: 'YouTube', cat: 'Entertainment', d: 0.6, w: 4.1, m: 18.2, memo: "Great for learning, easy to binge. Keep it on purpose — kill autoplay." },
  { name: 'Snapchat', cat: 'Social', d: 0.45, w: 3.0, m: 13.1, memo: "Streaks aren't worth your evening. Check it, then close it." },
  { name: 'X', cat: 'Social', d: 0.35, w: 2.4, m: 10.6, memo: "Doomscroll central. ~20 minutes keeps your head clear." },
  { name: 'Reddit', cat: 'Social', d: 0.3, w: 2.1, m: 9.4, memo: "Rabbit holes add up. Notice when you're just numbing out." },
  { name: 'Netflix', cat: 'Entertainment', d: 0.25, w: 2.6, m: 11.0, memo: "Fine in a real break — not as all-day background noise." },
  { name: 'Safari', cat: 'Other', d: 0.3, w: 2.0, m: 8.8, memo: "A lot of this is mindless searching. Be intentional with it." },
  { name: 'Spotify', cat: 'Entertainment', d: 0.5, w: 3.5, m: 15.0, necessity: true, memo: "Music's healthy — this rarely needs cutting." },
  { name: 'Messages', cat: 'Social', d: 0.6, w: 4.2, m: 18.0, necessity: true, memo: "Ideally under ~1h/day. Open it when someone texts you, not to pass time." },
  { name: 'Mail', cat: 'Productivity', d: 0.25, w: 1.7, m: 7.5, necessity: true, memo: "Work tool. Batch it 2–3 times a day instead of all day long." },
  { name: 'Phone', cat: 'Other', d: 0.3, w: 2.0, m: 8.5, necessity: true, memo: "Calls are real connection — never counted against you." },
  { name: 'FaceTime', cat: 'Other', d: 0.2, w: 1.4, m: 6.0, necessity: true, memo: "Face-to-face time is a win. Not counted against you." },
  { name: 'Maps', cat: 'Other', d: 0.15, w: 1.0, m: 4.5, necessity: true, memo: "A necessity — not counted against you." },
];
// Per-app daily limit, derived from the user's overall daily limit.
// Research (Hunt et al., 2018, U. Penn) points to ~30 min/day of social as a healthier target —
// so social/entertainment apps get tight, science-informed caps; flagged "struggle" apps get stricter still.
function appLimitMin(app, dailyLimitH, struggleApps) {
  if (app.necessity) return null; // needed apps are never capped
  const L = (dailyLimitH || 2) * 60;
  const frac = app.cat === 'Social' ? 0.12 : app.cat === 'Entertainment' ? 0.18 : app.cat === 'Productivity' ? 0.5 : 0.25;
  let cap = L * frac;
  if (app.cat === 'Social') cap = Math.min(cap, 40);
  if (app.cat === 'Entertainment') cap = Math.min(cap, 60);
  if ((struggleApps || []).includes(app.name)) cap *= 0.75; // stricter for apps the user flagged
  return Math.max(15, Math.round(cap));
}
const MENTOR_REPLIES = [
  { k: ['night', 'evening', 'bed', 'sleep', 'late'], a: 'Nights are hardest — the day’s discipline is spent. Charge your phone outside the bedroom and leave a book where it used to sit. The first three nights are the wall; after that it goes quiet.' },
  { k: ['bored', 'boredom'], a: 'Boredom is your brain asking for something real. It peaks and passes in about 90 seconds. Next time, stand up and change rooms before you decide — motion beats the urge.' },
  { k: ['instagram', 'tiktok', 'reel', 'scroll', 'feed', 'doom'], a: 'The feed is built to never end, so “one more” has no bottom. Turn on greyscale and move the app off your home screen — dull and buried, you’ll reach for it far less.' },
  { k: ['focus', 'work', 'study', 'concentrate'], a: 'Focus is a muscle. Start with one 25-minute phone-in-another-room block a day and grow it. Your longest stretch already hit 2h 14m — that’s proof you can.' },
  { k: ['relapse', 'failed', 'broke', 'streak', 'again', 'gave'], a: 'A broken streak isn’t failure — it’s data. What happened right before? Name the trigger, not the guilt. Day 1 tomorrow, and I’ll be right here.' },
  { k: ['why', 'addict', 'dopamine', 'hooked', 'can’t stop'], a: 'It isn’t weak willpower — these apps are engineered by teams optimizing for your attention with variable rewards, the same trick as a slot machine. Knowing that is step one; designing your space so the easy choice is the good one is step two.' },
];
function mentorReply(text) {
  const t = (text || '').toLowerCase();
  for (const r of MENTOR_REPLIES) if (r.k.some((k) => t.includes(k))) return r.a;
  return 'Tell me more — what’s the moment you keep losing? The time of day, the app, or the feeling right before you reach for it. We’ll build one small habit around it.';
}
// Contextual mentor note for the Home check-in — aware of time of day. (Backend AI will personalize this live.)
function sageNote(name) {
  const h = new Date().getHours();
  const who = name || 'friend';
  const morning = [
    `Morning, ${who}. Your first hour sets the tone — leave the phone face-down until you've had one real moment.`,
    `New day, clean slate. You were under your line yesterday — let's make it two.`,
  ];
  const afternoon = [
    `Midday check-in: Instagram's already your heaviest today. Not a scold — just so you decide the next hour on purpose.`,
    `You're pacing well, ${who}. The afternoon dip is when the scroll sneaks in — stand up before you reach.`,
  ];
  const evening = [
    `Evening is your danger hour, ${who}. Put something real where the scroll usually goes — a book, a walk, a call.`,
    `You're close to your line for today. One breath with your puck beats one more feed.`,
  ];
  const pool = h < 12 ? morning : h < 18 ? afternoon : evening;
  return pick(pool);
}

// ── Backend (Supabase): real auth + secure AI proxy ──────────────────────────
// Fill these in after running supabase/SETUP.md, then flip BACKEND_READY to true.
// When false, the app runs as an offline demo (local coach, mocked onboarding) — nothing breaks.
const SUPABASE_URL = 'https://sicpwxbrskcquzutkgst.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OxYeM4bYHRKWyzXWnrjrqw_wk3Pp8Il'; // publishable key — safe in the client (RLS-protected)
const BACKEND_READY = true;       // true → real sign-in + AI proxy; false → offline demo
const SAGE_FN_URL = SUPABASE_URL ? SUPABASE_URL + '/functions/v1/sage-chat' : '';
let SESSION = null;               // { access_token, refresh_token, user } once signed in

// AI mentor — routes through our Edge Function (key stays server-side). Falls back to the local coach offline.
async function sageAI(userText, context) {
  if (BACKEND_READY && SESSION && SESSION.access_token) {
    try {
      const res = await fetch(SAGE_FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SESSION.access_token },
        body: JSON.stringify({ userText, context }),
      });
      const j = await res.json();
      if (j && j.text) return String(j.text).trim();
    } catch (e) {}
  }
  return mentorReply(userText); // offline / not signed in → local coach
}

// SAGE-AGE — asks the backend to recompute "years saved" from real usage and return the stored result.
// Returns { years_saved, avg_hours, cut_hours, days_tracked, ready, headline } or null when offline.
const SAGE_AGE_FN_URL = SUPABASE_URL ? SUPABASE_URL + '/functions/v1/sage-age' : '';
async function sageAge() {
  if (BACKEND_READY && SESSION && SESSION.access_token) {
    try {
      const res = await fetch(SAGE_AGE_FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SESSION.access_token },
        body: JSON.stringify({ mode: 'user' }),
      });
      const j = await res.json();
      if (j && (j.years_saved !== undefined || j.ready !== undefined)) return j;
    } catch (e) {}
  }
  return null; // offline / not signed in → caller uses the local estimate
}

// ── Auth (Supabase GoTrue over REST — no extra packages needed) ──────────────
async function authSignUp(email, password, name) {
  const res = await fetch(SUPABASE_URL + '/auth/v1/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password, data: { name } }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.msg || j.error_description || j.error || 'Sign up failed');
  if (j.access_token) { SESSION = j; storageSet('sage_session', JSON.stringify(j)); }
  return j; // if email confirmation is on, there's no token yet — ask them to confirm, then sign in
}
async function authSignIn(email, password) {
  const res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.msg || j.error_description || j.error || 'Sign in failed');
  SESSION = j; storageSet('sage_session', JSON.stringify(j));
  return j;
}
function authSignOut() { SESSION = null; storageRemove('sage_session'); }
async function authDeleteAccount() {
  if (!SESSION) return;
  try {
    await fetch(SUPABASE_URL + '/rest/v1/rpc/delete_me', {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SESSION.access_token },
    });
  } catch (e) {}
  authSignOut();
}

const dayIndex = Math.floor(Date.now() / 86400000);
const pick = (arr, salt = 0) => arr[(dayIndex + salt) % arr.length];
const fmtH = (h) => { const m = Math.round((h % 1) * 60); return m === 0 ? `${Math.floor(h)}h` : `${Math.floor(h)}h ${m}m`; };
const fmtMin = (mins) => { const m = Math.round(mins); if (m < 60) return `${m}m`; const h = Math.floor(m / 60), mm = m % 60; return mm ? `${h}h ${mm}m` : `${h}h`; };
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
// subtle, Apple-style taps (safe no-op if native module absent)
// Master switch: keep OFF until running the build that was compiled WITH
// expo-haptics + async-storage. OFF = zero native calls = zero errors on any build.
const NATIVE_READY = true;
const hap = (type) => {
  if (!NATIVE_READY) return;
  try {
    if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === 'select') Haptics.selectionAsync();
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {}
};
let STORAGE_OK = true;
const storageGet = async (k) => { if (!NATIVE_READY) return null; try { return await AsyncStorage.getItem(k); } catch (e) { STORAGE_OK = false; return null; } };
const storageSet = (k, v) => { if (!NATIVE_READY || !STORAGE_OK) return; try { const p = AsyncStorage.setItem(k, v); if (p && p.catch) p.catch(() => {}); } catch (e) { STORAGE_OK = false; } };
const storageRemove = (k) => { if (!NATIVE_READY) return; try { const p = AsyncStorage.removeItem(k); if (p && p.catch) p.catch(() => {}); } catch (e) {} };

// ── Signature marks ──────────────────────────────────────────────────────────
function SageMark({ size = 40, color, stroke = 7 }) {
  // viewBox fully contains the S glyph plus its round-cap stroke (no clipping).
  return (
    <Svg width={size} height={size * 1.08} viewBox="20 10 76 82">
      <Path d={S_LOGO} fill="none" stroke={color || T.gold} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function Wordmark({ size = 46, color, mark }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <SageMark size={size} color={mark || T.gold} stroke={7} />
      <Text style={{ fontSize: size * 0.72, fontWeight: '700', color: color || T.text, letterSpacing: 0.5, marginLeft: -size * 0.1 }}>age</Text>
    </View>
  );
}

// ── Atoms ────────────────────────────────────────────────────────────────────
function Btn({ label, onPress, disabled, subtle, danger }) {
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={({ pressed }) => [{
        height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
        backgroundColor: subtle ? 'transparent' : (danger ? T.bad : T.gold),
        borderWidth: subtle ? 1.5 : 0, borderColor: T.line,
        opacity: disabled ? 0.35 : (pressed ? 0.88 : 1),
        transform: [{ scale: pressed ? 0.98 : 1 }],
      }]}>
      <Text style={{ color: subtle ? T.text : '#1E201B', fontWeight: '800', fontSize: 16, letterSpacing: 0.4 }}>{label}</Text>
    </Pressable>
  );
}
function Card({ children, style, onPress }) {
  const base = { backgroundColor: T.card, borderRadius: 22, borderWidth: 1, borderColor: T.line, padding: 18 };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
function Pulse({ children, style, amount = 0.06, speed = 1100 }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: speed, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: speed, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + amount] });
  return <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>;
}
function Toggle({ value, onChange }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: value ? T.gold : T.bg2, borderWidth: 1, borderColor: value ? T.gold : T.line, justifyContent: 'center', paddingHorizontal: 3 }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: value ? '#1E201B' : T.sub, alignSelf: value ? 'flex-end' : 'flex-start' }} />
    </Pressable>
  );
}
function Fade({ children, style, delay = 0 }) {
  const o = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(14)).current;
  const s = useRef(new Animated.Value(0.985)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(o, { toValue: 1, duration: 460, delay, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(s, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[{ flex: 1, opacity: o, transform: [{ translateY: y }, { scale: s }] }, style]}>{children}</Animated.View>;
}
// Premium modal pop — backdrop fades, card springs up from slightly small. Tap backdrop to close.
function Pop({ onClose, children, width = '100%', from = 0.86 }) {
  const o = useRef(new Animated.Value(0)).current;
  const s = useRef(new Animated.Value(from)).current;
  const ty = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(o, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(s, { toValue: 1, friction: 8, tension: 62, useNativeDriver: true }),
      Animated.spring(ty, { toValue: 0, friction: 8, tension: 62, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, opacity: o }}>
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
      <Animated.View style={{ width, transform: [{ scale: s }, { translateY: ty }] }}>{children}</Animated.View>
    </Animated.View>
  );
}
// Free-mode lock — shown where a paid feature would be. Purchases happen on the website, so this links out.
function LockCard({ title, line, cta = 'Unlock SAGE', compact }) {
  return (
    <View style={{ backgroundColor: T.card, borderRadius: 20, borderWidth: 1, borderColor: T.gold + '55', padding: compact ? 18 : 22, alignItems: 'center' }}>
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: T.gold + '1F', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22 }}>{'🔒'}</Text>
      </View>
      <Text style={{ color: T.text, fontSize: 17, fontWeight: '800', marginTop: 12, textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: T.sub, fontSize: 13.5, lineHeight: 20, marginTop: 7, textAlign: 'center' }}>{line}</Text>
      <Pressable onPress={() => Linking.openURL('https://sageband.co')} style={({ pressed }) => [{ backgroundColor: T.gold, borderRadius: 24, paddingVertical: 13, paddingHorizontal: 28, marginTop: 16, opacity: pressed ? 0.9 : 1 }]}>
        <Text style={{ color: '#1E201B', fontSize: 14.5, fontWeight: '800' }}>{cta}  {'›'}</Text>
      </Pressable>
      <Text style={{ color: T.sub, fontSize: 10.5, marginTop: 10, textAlign: 'center', lineHeight: 15 }}>Puck $79 · 1 month free, then $149/yr. Cancel anytime · sageband.co</Text>
    </View>
  );
}
// A single word that fades in on mount — the building block of the Claude-style flow.
function FadeWord({ text }) {
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(o, { toValue: 1, duration: 200, useNativeDriver: true }).start(); }, []);
  return <Animated.Text style={{ opacity: o }}>{text}</Animated.Text>;
}
// Reveals a reply word-by-word with a soft fade — flows like Claude, not a mechanical type-out.
function Typewriter({ text, style, speed = 42 }) {
  const words = text.split(' ');
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0); let i = 0;
    const id = setInterval(() => { i += 1; if (i >= words.length) { setN(words.length); clearInterval(id); } else setN(i); }, speed);
    return () => clearInterval(id);
  }, [text]);
  return <Text style={style}>{words.slice(0, n).map((w, i) => <FadeWord key={i} text={(i > 0 ? ' ' : '') + w} />)}</Text>;
}
function Ring({ pct, size = 224, stroke = 14, color, track, children }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track || T.line} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color || T.gold} strokeWidth={stroke} fill="none"
          strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - p)} strokeLinecap="round" />
      </Svg>
      {children}
    </View>
  );
}
function Wheel({ items, value, onChange, fmt }) {
  const IW = 76;
  const ref = useRef(null);
  const idx = Math.max(0, items.indexOf(value));
  const pad = (SCREEN_W - IW) / 2;
  useEffect(() => { const t = setTimeout(() => ref.current && ref.current.scrollTo({ x: idx * IW, animated: false }), 30); return () => clearTimeout(t); }, []);
  const settle = (x) => {
    const i = Math.round(x / IW);
    const v = items[Math.max(0, Math.min(items.length - 1, i))];
    if (v !== value) { onChange(v); hap('select'); }
  };
  return (
    <View style={{ height: 128, justifyContent: 'center' }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: pad, width: IW, height: 96, top: 16, borderRadius: 22, backgroundColor: T.gold + '1F', borderWidth: 1.5, borderColor: T.gold + '66' }} />
      <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} snapToInterval={IW} decelerationRate="fast"
        onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.x)}
        contentContainerStyle={{ paddingHorizontal: pad }}>
        {items.map((n) => {
          const on = n === value;
          return (
            <Pressable key={String(n)} onPress={() => { onChange(n); ref.current && ref.current.scrollTo({ x: items.indexOf(n) * IW, animated: true }); }}
              style={{ width: IW, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: on ? 36 : 22, fontWeight: on ? '700' : '400', color: on ? T.gold : T.sub }}>{fmt ? fmt(n) : n}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Splash (S zoom-out) ──────────────────────────────────────────────────────
function Splash({ onDone }) {
  const s = useRef(new Animated.Value(1.7)).current;
  const o = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(o, { toValue: 1, duration: 620, useNativeDriver: true }),
        Animated.spring(s, { toValue: 1, friction: 7, tension: 42, useNativeDriver: true }),
      ]),
      Animated.delay(520),
      Animated.timing(out, { toValue: 0, duration: 460, useNativeDriver: true }),
    ]).start(() => onDone && onDone());
  }, []);
  return (
    <Animated.View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', opacity: out }}>
      <Animated.View style={{ opacity: o, transform: [{ scale: s }] }}>
        <Wordmark size={72} />
      </Animated.View>
      <Animated.Text style={{ opacity: o, color: T.sub, letterSpacing: 4, marginTop: 18, fontSize: 11 }}>A MENTOR ON YOUR PHONE</Animated.Text>
    </Animated.View>
  );
}

// ── Onboarding ───────────────────────────────────────────────────────────────
function StepShell({ children, kicker, title, sub, onBack }) {
  return (
    <Fade style={{ backgroundColor: T.bg }}>
      <View style={{ flex: 1, paddingTop: TOP + 8, paddingHorizontal: 26 }}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={{ marginBottom: 20 }}>
            <Text style={{ color: T.sub, fontSize: 15 }}>{'‹'}  Back</Text>
          </Pressable>
        ) : <View style={{ height: 24 }} />}
        {kicker ? <Text style={{ color: T.gold, letterSpacing: 3, fontSize: 11, fontWeight: '700', marginBottom: 12 }}>{kicker}</Text> : null}
        {title ? <Text style={{ color: T.text, fontSize: 30, fontWeight: '700', lineHeight: 38 }}>{title}</Text> : null}
        {sub ? <Text style={{ color: T.sub, fontSize: 15.5, lineHeight: 23, marginTop: 12 }}>{sub}</Text> : null}
        {children}
      </View>
    </Fade>
  );
}

function ObWelcome({ onNext }) {
  return (
    <Fade style={{ backgroundColor: T.bg }}>
      <Image source={IMG.welcome} style={{ position: 'absolute', top: 0, left: 0, width: SCREEN_W, height: SCREEN_H }} resizeMode="cover" />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12,14,10,0.55)' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
        <Wordmark size={64} color="#F5F2EA" />
        <Text style={{ color: '#F5F2EA', fontSize: 22, fontWeight: '600', textAlign: 'center', marginTop: 34, lineHeight: 30 }}>
          A mentor for your screen time.
        </Text>
        <Text style={{ color: 'rgba(245,242,234,0.82)', fontSize: 15.5, textAlign: 'center', marginTop: 12, lineHeight: 23 }}>
          Not a cop. Sage nudges, reflects, and hands the day back to you.
        </Text>
        <View style={{ position: 'absolute', bottom: 54, left: 30, right: 30 }}>
          <Btn label="Begin" onPress={onNext} />
          <Text style={{ color: 'rgba(245,242,234,0.82)', fontSize: 12, textAlign: 'center', marginTop: 16 }}>Takes about a minute.</Text>
        </View>
      </View>
    </Fade>
  );
}
function ObName({ user, up, onNext, onBack }) {
  const [v, setV] = useState(user.name || '');
  return (
    <StepShell onBack={onBack} kicker="ABOUT YOU" title={'What should\nSage call you?'}>
      <View style={{ marginTop: 44, alignItems: 'center' }}>
        <TextInput value={v} onChangeText={setV} placeholder="your name" placeholderTextColor={T.sub} keyboardAppearance={T.dark ? 'dark' : 'light'}
          autoFocus autoCapitalize="words" returnKeyType="done" onSubmitEditing={() => v.trim() && (up({ name: v.trim() }), onNext())}
          style={{ fontSize: 34, fontWeight: '700', color: T.text, textAlign: 'center', paddingVertical: 6, minWidth: 200 }} />
        <View style={{ height: 2, width: 220, backgroundColor: T.gold, marginTop: 6, borderRadius: 2 }} />
      </View>
      <View style={{ position: 'absolute', bottom: 46, left: 26, right: 26 }}>
        <Btn label="Continue" disabled={!v.trim()} onPress={() => { up({ name: v.trim() }); onNext(); }} />
      </View>
    </StepShell>
  );
}
function ObAge({ user, up, onNext, onBack }) {
  const [v, setV] = useState(user.age || 22);
  const items = []; for (let i = 13; i <= 90; i++) items.push(i);
  return (
    <StepShell onBack={onBack} kicker="ABOUT YOU" title="How old are you?" sub="Sage tailors your reflections to where you are in life.">
      <View style={{ marginTop: 60, marginHorizontal: -26 }}>
        <Wheel items={items} value={v} onChange={setV} />
      </View>
      <View style={{ position: 'absolute', bottom: 46, left: 26, right: 26 }}>
        <Btn label="Continue" onPress={() => { up({ age: v }); onNext(); }} />
      </View>
    </StepShell>
  );
}
function ObHours({ user, up, onNext, onBack }) {
  const items = []; for (let h = 1; h <= 14; h += 1) items.push(h);
  const [v, setV] = useState(user.avgHours || 4);
  return (
    <StepShell onBack={onBack} kicker="THE TRUTH" title={'On an average day,\nhow long on your phone?'} sub="Be honest — Screen Time already knows.">
      <View style={{ marginTop: 44 }}>
        <View style={{ marginHorizontal: -26 }}>
          <Wheel items={items} value={v} onChange={setV} fmt={fmtH} />
        </View>
        <View style={{ alignItems: 'center', marginTop: 26 }}>
          <Text style={{ color: T.sub, fontSize: 14 }}>that's</Text>
          <Text style={{ color: T.goldSoft, fontSize: 36, fontWeight: '800', marginTop: 2 }}>{Math.round(v * 365 / 24)} days a year</Text>
        </View>
      </View>
      <View style={{ position: 'absolute', bottom: 46, left: 26, right: 26 }}>
        <Btn label="Continue" onPress={() => { up({ avgHours: v }); onNext(); }} />
      </View>
    </StepShell>
  );
}
function FaceLeaf({ size = 82 }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110">
      <Ellipse cx="50" cy="54" rx="46" ry="50" fill={T.gold} opacity="0.16" />
      <Path d="M50 6 C20 30 18 72 50 102 C82 72 80 30 50 6 Z" fill={T.good} />
      <Path d="M50 6 C20 30 18 72 50 102 C82 72 80 30 50 6 Z" fill="none" stroke={T.gold} strokeWidth="3" />
      <Circle cx="41" cy="52" r="4.5" fill="#12211A" />
      <Circle cx="59" cy="52" r="4.5" fill="#12211A" />
      <Path d="M41 66 Q50 73 59 66" stroke="#12211A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Circle cx="34" cy="61" r="3.4" fill={T.bad} opacity="0.5" />
      <Circle cx="66" cy="61" r="3.4" fill={T.bad} opacity="0.5" />
    </Svg>
  );
}
function WalkingLeaf({ caption }) {
  const walk = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const bubble = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(walk, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(sway, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(sway, { toValue: -1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    Animated.timing(bubble, { toValue: 1, duration: 400, delay: 1300, useNativeDriver: true }).start();
  }, []);
  const baseScale = walk.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const tx = walk.interpolate({ inputRange: [0, 1], outputRange: [50, 0] });
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const rot = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] });
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Animated.View style={{ opacity: bubble, alignItems: 'flex-end' }}>
        <View style={{ backgroundColor: T.card, borderWidth: 1, borderColor: T.gold, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, maxWidth: 172 }}>
          <Text style={{ color: T.text, fontSize: 11.5, lineHeight: 16 }}>{caption}</Text>
        </View>
        {/* tail — speech coming from the character below */}
        <View style={{ width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: T.gold, marginRight: 30, marginTop: -1 }} />
      </Animated.View>
      <Animated.View style={{ marginTop: 2, transform: [{ translateX: tx }, { translateY: bobY }, { rotate: rot }, { scale: baseScale }] }}>
        <FaceLeaf size={78} />
      </Animated.View>
    </View>
  );
}
function ObReveal({ user, onNext, onBack }) {
  const avg = user.avgHours || 4;
  const days = Math.round(avg * 365 / 24);
  const pctYear = Math.round((avg / 24) * 100);
  return (
    <StepShell onBack={onBack} kicker="THE HONEST PART">
      <View style={{ position: 'absolute', top: TOP + 34, right: 18, width: 164, alignItems: 'center', zIndex: 5 }}>
        <WalkingLeaf caption={`hey — that's ${pctYear}% of your year, gone to a screen you won't even remember.`} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 60 }}>
        <Text style={{ color: T.sub, fontSize: 16 }}>At {fmtH(avg)} a day, you'll spend</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text style={{ color: T.gold, fontSize: 80, fontWeight: '800' }}>{days}</Text>
          <Text style={{ color: T.text, fontSize: 26, fontWeight: '700', marginBottom: 16, marginLeft: 6 }}>days</Text>
        </View>
        <View style={{ backgroundColor: OVER, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, marginTop: 2 }}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 }}>WASTED THIS YEAR</Text>
        </View>
        <Text style={{ color: T.text, fontSize: 20, fontWeight: '600', lineHeight: 28, marginTop: 18 }}>looking down at a screen.</Text>
        <Text style={{ color: T.sub, fontSize: 15, lineHeight: 23, marginTop: 14 }}>
          That's not a scold — it's the number Sage helps you shrink. Let's draw a line.
        </Text>
      </View>
      <View style={{ position: 'absolute', bottom: 46, left: 26, right: 26 }}>
        <Btn label="Set my limit" onPress={onNext} />
      </View>
    </StepShell>
  );
}
function ObLimit({ user, up, onNext, onBack }) {
  const items = []; for (let h = 1; h <= 6; h += 1) items.push(h); // whole hours — clean
  const [v, setV] = useState(Math.round(user.limitHours || 2));
  const avg = user.avgHours || 4;
  const saved = Math.max(0, avg - v);
  const age = user.age || 22;
  const yearsLeft = Math.max(1, 84 - age);
  const daysYear = Math.round(saved * 365 / 24);
  const daysLife = Math.round(saved * 365 * yearsLeft / 24);
  const yearsLife = (daysLife / 365).toFixed(1);
  return (
    <StepShell onBack={onBack} kicker="YOUR LINE" title={'Where should Sage\ndraw the line?'} sub="Your daily budget. Move it anytime.">
      <View style={{ marginTop: 30 }}>
        <View style={{ marginHorizontal: -26 }}>
          <Wheel items={items} value={v} onChange={setV} fmt={fmtH} />
        </View>
        {saved > 0 ? (
          <View style={{ alignItems: 'center', marginTop: 30 }}>
            <Text style={{ color: T.sub, fontSize: 13.5, letterSpacing: 0.5 }}>you'd reclaim</Text>
            <Pulse>
              <Text style={{ color: T.gold, fontSize: 54, fontWeight: '800', textShadowColor: T.gold + '77', textShadowRadius: 14 }}>{daysYear} days</Text>
            </Pulse>
            <Text style={{ color: T.goldSoft, fontSize: 15, fontWeight: '600', marginTop: 2 }}>in the next year alone</Text>
            <View style={{ height: 1, backgroundColor: T.line, width: 130, marginVertical: 22 }} />
            <Text style={{ color: T.sub, fontSize: 13 }}>over the rest of your life</Text>
            <Text style={{ color: T.text, fontSize: 26, fontWeight: '800', marginTop: 4, textDecorationLine: 'underline', textDecorationColor: T.gold }}>{daysLife.toLocaleString()} days</Text>
            <Text style={{ color: T.goldSoft, fontSize: 16, fontWeight: '700', marginTop: 5, letterSpacing: 0.3 }}>≈ {yearsLife} years reclaimed</Text>
          </View>
        ) : (
          <Text style={{ color: T.sub, fontSize: 14, textAlign: 'center', marginTop: 24 }}>a gentle place to start</Text>
        )}
      </View>
      <View style={{ position: 'absolute', bottom: 38, left: 26, right: 26 }}>
        <Btn label="Lock it in" onPress={() => { up({ limitHours: v }); onNext(); }} />
      </View>
    </StepShell>
  );
}
function ObPermission({ onNext, onBack }) {
  return (
    <Fade style={{ backgroundColor: T.bg }}>
      <View style={{ flex: 1, paddingTop: TOP + 8, paddingHorizontal: 30 }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ paddingVertical: 6 }}><Text style={{ color: T.sub, fontSize: 24 }}>{'‹'}</Text></Pressable>
        <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 30 }}>
          <Text style={{ color: T.gold, letterSpacing: 3, fontSize: 12, fontWeight: '800', marginBottom: 18 }}>ONE RULE</Text>
          <Text style={{ color: T.text, fontSize: 42, fontWeight: '800', lineHeight: 46, letterSpacing: -0.5 }}>TRACK ALL{'\n'}APPS OR{'\n'}NOTHING{'\n'}AT ALL.</Text>
          <Text style={{ color: T.sub, fontSize: 16, lineHeight: 24, marginTop: 22 }}>SAGE watches your whole phone — every app's screen time. No cherry-picking the easy ones, no cheating yourself. It's the only way your breakdown is real and your mentor can be honest.</Text>
          <Text style={{ color: T.sub, fontSize: 13, lineHeight: 20, marginTop: 16 }}>We only ever see <Text style={{ color: T.text, fontWeight: '700' }}>time per app</Text> — never what's on your screen, never your messages. We never sell your data.</Text>
        </View>
        <View style={{ paddingBottom: 44 }}>
          <Btn label="Track everything" onPress={onNext} />
          <Pressable onPress={onBack} style={{ alignItems: 'center', marginTop: 16 }}><Text style={{ color: T.sub, fontSize: 14 }}>not for me</Text></Pressable>
        </View>
      </View>
    </Fade>
  );
}

function Bubbles({ selected, onToggle }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {APPS.map((a) => {
        const on = selected.includes(a);
        return (
          <Pressable key={a} onPress={() => onToggle(a)}
            style={({ pressed }) => [{
              paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100,
              backgroundColor: on ? T.gold : 'transparent', borderWidth: 1.5, borderColor: on ? T.gold : T.line,
              opacity: pressed ? 0.85 : 1,
            }]}>
            <Text style={{ color: on ? '#1E201B' : T.text, fontWeight: on ? '700' : '500', fontSize: 14.5 }}>{a}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
function ObApps({ user, up, onNext, onBack }) {
  const [sub, setSub] = useState(0); // 0 = work, 1 = struggle
  const [work, setWork] = useState(user.workApps || []);
  const [str, setStr] = useState(user.struggleApps || []);
  const tog = (list, set) => (a) => { set(list.includes(a) ? list.filter(x => x !== a) : [...list, a]); };
  if (sub === 0) {
    return (
      <StepShell onBack={onBack} kicker="YOUR APPS" title="Which apps are for work?" sub="These won’t count against your limit. Sage is watching — don’t pad the list. 😉">
        <ScrollView style={{ marginTop: 22, marginHorizontal: -2 }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          <Bubbles selected={work} onToggle={tog(work, setWork)} />
        </ScrollView>
        <View style={{ position: 'absolute', bottom: 40, left: 26, right: 26 }}>
          <Btn label={work.length ? `Continue (${work.length})` : 'None of these'} onPress={() => { up({ workApps: work }); setSub(1); }} />
        </View>
      </StepShell>
    );
  }
  return (
    <StepShell onBack={() => setSub(0)} kicker="YOUR APPS" title="Which do you struggle to put down?" sub="The honest ones. Sage will track these hardest and tell you, week by week, if you’re winning.">
      <ScrollView style={{ marginTop: 22, marginHorizontal: -2 }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <Bubbles selected={str} onToggle={tog(str, setStr)} />
      </ScrollView>
      <View style={{ position: 'absolute', bottom: 40, left: 26, right: 26 }}>
        <Btn label={str.length ? `That’s me (${str.length})` : 'Skip for now'} onPress={() => { up({ struggleApps: str }); onNext(); }} />
      </View>
    </StepShell>
  );
}

// Whoop-style puck connection guide (replaces the old paywall step)
function PhonePuck({ go }) {
  const depth = useRef(new Animated.Value(0)).current; // 0 hovering in front → 1 embedded on the back
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!go) return;
    Animated.timing(depth, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })
      .start(() => { setDone(true); hap('success'); });
    const loop = (v, d) => Animated.loop(Animated.sequence([Animated.delay(d), Animated.timing(v, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true })]));
    const t = setTimeout(() => Animated.parallel([loop(ring1, 0), loop(ring2, 750)]).start(), 650);
    return () => clearTimeout(t);
  }, [go]);
  const scale = depth.interpolate({ inputRange: [0, 1], outputRange: [1.42, 0.78] });
  const ty = depth.interpolate({ inputRange: [0, 1], outputRange: [-38, 0] });
  const puckOp = depth.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] });
  const glassOp = depth.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 0.9] });
  const R = (v) => ({ opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.9] }) }] });
  return (
    <View style={{ height: 320, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 152, height: 306, borderRadius: 36, borderWidth: 2, borderColor: T.line, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: 12, width: 46, height: 6, borderRadius: 3, backgroundColor: T.line }} />
        {go && <>
          <Animated.View style={[{ position: 'absolute', width: 104, height: 104, borderRadius: 52, borderWidth: 2, borderColor: T.gold }, R(ring1)]} />
          <Animated.View style={[{ position: 'absolute', width: 104, height: 104, borderRadius: 52, borderWidth: 2, borderColor: T.gold }, R(ring2)]} />
        </>}
        <Animated.View style={{ opacity: puckOp, transform: [{ translateY: ty }, { scale }] }}>
          <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: T.bg2, borderWidth: 2, borderColor: T.gold, alignItems: 'center', justifyContent: 'center', shadowColor: T.gold, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }}>
            <SageMark size={44} />
          </View>
        </Animated.View>
        {/* the phone's glass slides over the puck as it settles onto the back */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.dark ? 'rgba(18,20,15,0.5)' : 'rgba(245,242,234,0.5)', opacity: glassOp }} />
      </View>
      <Text style={{ color: done ? T.good : T.sub, fontWeight: '700', marginTop: 16, fontSize: 14 }}>{done ? 'Connected ✓' : ' '}</Text>
    </View>
  );
}
function ObConnect({ user, up, onDone, onBack }) {
  const [sub, setSub] = useState(0); // 0 attach, 1 name
  const [go, setGo] = useState(false);
  const [name, setName] = useState('');
  if (sub === 0) {
    return (
      <StepShell onBack={onBack} kicker="CONNECT">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
          <PhonePuck go={go} />
          <Text style={{ color: T.text, fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: 10 }}>Attach Sage to the back of your phone.</Text>
          <Text style={{ color: T.sub, fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 22 }}>Hold it near the back — MagSafe pulls it in with a gentle click.</Text>
        </View>
        <View style={{ position: 'absolute', bottom: 46, left: 26, right: 26 }}>
          {!go
            ? <Btn label="It’s on" onPress={() => { setGo(true); setTimeout(() => setSub(1), 1950); }} />
            : <Text style={{ color: T.sub, textAlign: 'center', fontSize: 15 }}>Snapping in{'…'}</Text>}
        </View>
      </StepShell>
    );
  }
  return (
    <StepShell onBack={() => setSub(0)} kicker="ALMOST THERE" title="Name your puck" sub="Give it something you’ll smile at when it buzzes.">
      <View style={{ marginTop: 40, alignItems: 'center' }}>
        <Image source={IMG.puck} style={{ width: 118, height: 118, borderRadius: 59, marginBottom: 24, borderWidth: 2, borderColor: T.gold }} resizeMode="cover" />
        <TextInput value={name} onChangeText={setName} placeholder="Sage" placeholderTextColor={T.sub} keyboardAppearance={T.dark ? 'dark' : 'light'}
          autoFocus returnKeyType="done"
          style={{ fontSize: 30, fontWeight: '700', color: T.text, textAlign: 'center', paddingVertical: 6, minWidth: 180 }} />
        <View style={{ height: 2, width: 200, backgroundColor: T.gold, marginTop: 6, borderRadius: 2 }} />
      </View>
      <View style={{ position: 'absolute', bottom: 46, left: 26, right: 26 }}>
        <Btn label="Finish setup" onPress={() => { up({ puck: (name.trim() || 'Sage'), perm: true }); onDone(); }} />
      </View>
    </StepShell>
  );
}

// ── Home ─────────────────────────────────────────────────────────────────────
function Stat({ label, value, onPress }) {
  return (
    <Card onPress={onPress} style={{ flex: 1, paddingVertical: 16, alignItems: 'center' }}>
      <Text style={{ color: T.gold, fontSize: 22, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: T.sub, fontSize: 11.5, marginTop: 4, letterSpacing: 0.3 }}>{label}</Text>
    </Card>
  );
}
function LifeDecor() {
  if (!T.lively) return null;
  const blob = (c, s, top, left) => (
    <View style={{ position: 'absolute', top, left, width: s, height: s, borderRadius: s / 2, backgroundColor: c, opacity: 0.14 }} />
  );
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}>
      {blob(T.good, 150, 30, -40)}
      {blob(T.gold, 110, 120, SCREEN_W - 70)}
      {blob(T.bad, 90, 260, 20)}
    </View>
  );
}
function sceneColors() {
  if (T.key === 'cream') return { sky1: '#D7E4D6', sun: '#EBD199', m1: '#BCCBB6', m2: '#9FB69C', tree: '#5F7C60', mist: '#FFFFFF' };
  if (T.key === 'life') return { sky1: '#173626', sun: '#F5B53C', m1: '#1C4131', m2: '#245139', tree: '#102A1D', mist: '#3FD98A' };
  return { sky1: '#28352B', sun: '#C7A24E', m1: '#20291F', m2: '#2A3527', tree: '#161E17', mist: '#C7A24E' }; // sage / night
}
function NatureScene({ height = 320 }) {
  const c = sceneColors(); const W = SCREEN_W; const h = height;
  const far = `M0 ${h * 0.46} L${W * 0.15} ${h * 0.32} L${W * 0.30} ${h * 0.44} L${W * 0.5} ${h * 0.28} L${W * 0.68} ${h * 0.42} L${W * 0.85} ${h * 0.32} L${W} ${h * 0.40} L${W} ${h} L0 ${h} Z`;
  const back = `M0 ${h * 0.56} L${W * 0.18} ${h * 0.40} L${W * 0.34} ${h * 0.52} L${W * 0.55} ${h * 0.34} L${W * 0.72} ${h * 0.48} L${W * 0.9} ${h * 0.38} L${W} ${h * 0.46} L${W} ${h} L0 ${h} Z`;
  const mid = `M0 ${h * 0.70} L${W * 0.26} ${h * 0.52} L${W * 0.46} ${h * 0.66} L${W * 0.68} ${h * 0.50} L${W * 0.86} ${h * 0.64} L${W} ${h * 0.56} L${W} ${h} L0 ${h} Z`;
  const n = 13, pw = W / n, pines = [], pines2 = [];
  for (let i = 0; i <= n; i++) { const x = i * pw, ph = 32 + ((i * 7) % 4) * 10; pines.push(<Polygon key={'p' + i} points={`${x - pw * 0.62},${h} ${x},${h - ph} ${x + pw * 0.62},${h}`} fill={c.tree} />); }
  for (let i = 0; i <= n; i++) { const x = i * pw + pw * 0.5, ph = 22 + ((i * 5) % 3) * 9; pines2.push(<Polygon key={'q' + i} points={`${x - pw * 0.5},${h} ${x},${h - ph} ${x + pw * 0.5},${h}`} fill={c.tree} opacity={0.8} />); }
  const stars = T.dark ? Array.from({ length: 16 }).map((_, i) => <Circle key={'s' + i} cx={(i * 47) % W} cy={8 + ((i * 31) % Math.round(h * 0.26))} r={i % 3 === 0 ? 1.5 : 0.9} fill="#FFFFFF" opacity={0.5} />) : null;
  return (
    <Svg width={W} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.sky1} stopOpacity="1" />
          <Stop offset="1" stopColor={T.bg} stopOpacity="1" />
        </LinearGradient>
        <RadialGradient id="sun" cx="0.72" cy="0.22" r="0.6">
          <Stop offset="0" stopColor={c.sun} stopOpacity="0.55" />
          <Stop offset="1" stopColor={c.sun} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Path d={`M0 0 L${W} 0 L${W} ${h} L0 ${h} Z`} fill="url(#sky)" />
      {stars}
      <Path d={`M0 0 L${W} 0 L${W} ${h} L0 ${h} Z`} fill="url(#sun)" />
      <Circle cx={W * 0.72} cy={h * 0.22} r={22} fill={c.sun} opacity={0.5} />
      <Ellipse cx={W * 0.3} cy={h * 0.18} rx={72} ry={11} fill={c.mist} opacity={0.08} />
      <Ellipse cx={W * 0.8} cy={h * 0.13} rx={52} ry={9} fill={c.mist} opacity={0.06} />
      <Path d={far} fill={c.m1} opacity={0.5} />
      <Path d={back} fill={c.m1} />
      <Ellipse cx={W * 0.5} cy={h * 0.66} rx={W * 0.65} ry={15} fill={c.mist} opacity={0.07} />
      <Path d={mid} fill={c.m2} />
      {pines}
      {pines2}
    </Svg>
  );
}
function Horizon({ height = 210, opacity = 1 }) {
  const c = sceneColors(); const W = SCREEN_W; const h = height;
  const back = `M0 ${h * 0.5} L${W * 0.2} ${h * 0.28} L${W * 0.42} ${h * 0.46} L${W * 0.62} ${h * 0.26} L${W * 0.82} ${h * 0.44} L${W} ${h * 0.32} L${W} ${h} L0 ${h} Z`;
  const n = 13, pw = W / n, pines = [];
  for (let i = 0; i <= n; i++) { const x = i * pw, ph = 26 + ((i * 7) % 4) * 9; pines.push(<Polygon key={i} points={`${x - pw * 0.6},${h} ${x},${h - ph} ${x + pw * 0.6},${h}`} fill={c.tree} />); }
  return (
    <Svg width={W} height={h} style={{ position: 'absolute', bottom: 0, left: 0, opacity }} pointerEvents="none">
      <Path d={back} fill={c.m2} />
      {pines}
    </Svg>
  );
}
function FloatingLeaves({ count = 5, height = 340 }) {
  const leaves = useRef(Array.from({ length: count }).map(() => ({
    x: Math.random() * SCREEN_W, a: new Animated.Value(0),
    dur: 9000 + Math.random() * 7000, size: 12 + Math.random() * 12, delay: Math.random() * 5000,
  }))).current;
  useEffect(() => {
    const run = (l) => { l.a.setValue(0); Animated.timing(l.a, { toValue: 1, duration: l.dur, delay: l.delay, easing: Easing.linear, useNativeDriver: true }).start(() => run(l)); };
    leaves.forEach(run);
  }, []);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}>
      {leaves.map((l, i) => {
        const ty = l.a.interpolate({ inputRange: [0, 1], outputRange: [-24, height] });
        const tx = l.a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [l.x, l.x + 22, l.x - 22] });
        const rot = l.a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '220deg'] });
        const op = l.a.interpolate({ inputRange: [0, 0.12, 0.88, 1], outputRange: [0, 0.5, 0.5, 0] });
        return <Animated.View key={i} style={{ position: 'absolute', opacity: op, transform: [{ translateX: tx }, { translateY: ty }, { rotate: rot }] }}><TinyLeaf size={l.size} color={T.good} /></Animated.View>;
      })}
    </View>
  );
}
function LeafChar({ onPress }) {
  const sway = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(sway, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(sway, { toValue: -1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);
  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });
  const ty = float.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', justifyContent: 'center', height: 118 }}>
      <Animated.View style={{ transform: [{ translateY: ty }, { rotate }] }}>
        <Svg width={94} height={104} viewBox="0 0 100 110">
          <Ellipse cx="50" cy="54" rx="46" ry="50" fill={T.gold} opacity="0.14" />
          <Path d="M50 6 C20 30 18 72 50 102 C82 72 80 30 50 6 Z" fill={T.good} />
          <Path d="M50 6 C20 30 18 72 50 102 C82 72 80 30 50 6 Z" fill="none" stroke={T.gold} strokeWidth="3" />
          <Path d="M50 14 L50 96" stroke={T.gold} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <Path d="M50 40 L34 30 M50 54 L32 48 M50 68 L36 66 M50 40 L66 30 M50 54 L68 48 M50 68 L64 66" stroke={T.gold} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}
function BottomFade({ height = 110 }) {
  return (
    <Svg width={SCREEN_W} height={height} style={{ position: 'absolute', bottom: 0, left: 0 }} pointerEvents="none">
      <Defs>
        <LinearGradient id="bfade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={T.bg} stopOpacity="0" />
          <Stop offset="1" stopColor={T.bg} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Path d={`M0 0 L${SCREEN_W} 0 L${SCREEN_W} ${height} L0 ${height} Z`} fill="url(#bfade)" />
    </Svg>
  );
}
function AppIcon({ name, size = 46 }) {
  const c = BRAND[name] || T.gold;
  const darkText = name === 'Snapchat';
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: darkText ? '#1E201B' : '#fff', fontWeight: '800', fontSize: size * 0.44 }}>{name[0]}</Text>
    </View>
  );
}
function SageOrb({ onPress }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const op = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.4] });
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', justifyContent: 'center', height: 118 }}>
      <Animated.View style={{ position: 'absolute', width: 118, height: 118, borderRadius: 59, backgroundColor: T.gold, opacity: op, transform: [{ scale }] }} />
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: T.bg2, borderWidth: 2, borderColor: T.gold, alignItems: 'center', justifyContent: 'center', shadowColor: T.gold, shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 0 } }}>
        <SageMark size={50} />
      </View>
    </Pressable>
  );
}
function PillarBubble({ id, onPress }) {
  const p = PILLARS[id];
  return (
    <Pressable onPress={() => onPress(id)} style={({ pressed }) => [{ flex: 1, alignItems: 'center', transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
      <View style={{ shadowColor: p.accent, shadowOpacity: 0.6, shadowRadius: 15, shadowOffset: { width: 0, height: 0 }, borderRadius: 50 }}>
        <Ring pct={p.score / 100} size={94} stroke={7} color={p.accent} track={T.dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.55)'}>
          <Text style={{ color: T.text, fontSize: 22, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.18)', textShadowRadius: 4 }}>{p.score}</Text>
        </Ring>
      </View>
      <Text style={{ color: T.text, fontSize: 12.5, marginTop: 10, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.22)', textShadowRadius: 4 }}>{p.label}</Text>
    </Pressable>
  );
}
function DistractingWidget() {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: OVER, marginRight: 8 }} />
        <Text style={{ color: T.text, fontSize: 15, fontWeight: '700' }}>Pulling at you today</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {DISTRACTING.map(([name, hrs]) => (
          <View key={name} style={{ alignItems: 'center', flex: 1 }}>
            <AppIcon name={name} size={50} />
            <Text style={{ color: T.text, fontSize: 12.5, fontWeight: '800', marginTop: 7 }}>{fmtH(hrs)}</Text>
            <Text style={{ color: T.sub, fontSize: 10 }} numberOfLines={1}>{name}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
function RankTrail({ onPress }) {
  const idx = RANKS.findIndex((r) => r[0] === rankNow[0]);
  return (
    <Card onPress={onPress}>
      <Text style={{ color: T.sub, fontSize: 11, letterSpacing: 2, fontWeight: '700', marginBottom: 16 }}>YOUR PATH</Text>
      <View style={{ position: 'relative' }}>
        <View style={{ position: 'absolute', left: 12, right: 12, top: 8, height: 3, backgroundColor: T.line, borderRadius: 2 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {RANKS.map((r, i) => {
            const done = i <= idx; const cur = i === idx;
            return (
              <View key={i} style={{ alignItems: 'center', width: `${100 / RANKS.length}%` }}>
                <View style={{ width: cur ? 20 : 16, height: cur ? 20 : 16, borderRadius: 10, backgroundColor: done ? T.gold : T.bg2, borderWidth: 2, borderColor: done ? T.gold : T.line, alignItems: 'center', justifyContent: 'center' }}>
                  {cur ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#1E201B' }} /> : null}
                </View>
                <Text numberOfLines={1} style={{ color: cur ? T.gold : T.sub, fontSize: 9, marginTop: 7, fontWeight: cur ? '700' : '400' }}>{r[0].split(' ')[0]}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <Text style={{ color: T.text, fontSize: 13, marginTop: 14 }}>{rankNext ? `${rankNext[1] - POINTS} points to ${rankNext[0]}` : 'Top rank reached'}  {'›'}</Text>
    </Card>
  );
}
function TinyLeaf({ size = 20, color }) {
  return (
    <Svg width={size} height={size * 1.08} viewBox="0 0 100 108">
      <Path d="M50 6 C20 30 18 70 50 100 C82 70 80 30 50 6 Z" fill={color || T.good} />
      <Path d="M50 16 L50 90" stroke={T.bg} strokeWidth="5" strokeLinecap="round" opacity="0.3" />
    </Svg>
  );
}
// Free mode — SAGE is "asleep". Deliberately shows only the raw mirror (today + week totals), no coaching, no ritual.
function FreeHome({ user, onRestart }) {
  const used = 1.6; const week = WEEK.reduce((a, b) => a + b, 0);
  return (
    <View style={{ flex: 1 }}>
      <Image source={IMG.home} style={{ position: 'absolute', top: 0, left: 0, width: SCREEN_W, height: SCREEN_H }} resizeMode="cover" />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.dark ? 'rgba(16,18,13,0.62)' : 'rgba(245,242,234,0.55)' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: TOP, paddingHorizontal: 22, paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <SageMark size={26} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: T.text, fontSize: 22, fontWeight: '700' }}>{greet()}, {user.name || 'friend'}</Text>
          </View>
        </View>
        <Text style={{ color: T.sub, fontSize: 13.5, marginBottom: 20 }}>Here's your screen time. That's all the free app does.</Text>

        <Card style={{ paddingVertical: 22 }}>
          <Text style={{ color: T.sub, fontSize: 12, letterSpacing: 2, fontWeight: '700' }}>TODAY</Text>
          <Text style={{ color: T.text, fontSize: 46, fontWeight: '800', marginTop: 4 }}>{fmtH(used)}</Text>
          <View style={{ height: 1, backgroundColor: T.line, marginVertical: 16 }} />
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: T.sub, fontSize: 12 }}>This week</Text>
              <Text style={{ color: T.text, fontSize: 20, fontWeight: '800', marginTop: 2 }}>{fmtH(week)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: T.sub, fontSize: 12 }}>Daily average</Text>
              <Text style={{ color: T.text, fontSize: 20, fontWeight: '800', marginTop: 2 }}>{fmtH(week / 7)}</Text>
            </View>
          </View>
          <Text style={{ color: T.sub, fontSize: 11.5, marginTop: 16, lineHeight: 17 }}>Tracking every app, always. Insights, limits and your mentor stay off until SAGE is active.</Text>
        </Card>

        <View style={{ marginTop: 16 }}>
          <LockCard title="SAGE is asleep." line={`Hey ${user.name || 'there'} — I'm your mentor, but I can't help until SAGE is active. Snap on your puck and start your membership to wake me up: the limit ritual, daily coaching, and the nudge that actually works.`} cta="Wake up SAGE" />
        </View>

        <Pressable onPress={onRestart} style={{ alignSelf: 'center', marginTop: 26, padding: 8 }}>
          <Text style={{ color: T.sub, fontSize: 12.5 }}>{'↺'}  Restart demo</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
function Home({ user, up, hits, onLimit, onMentor, onPillar, onAchieve, onRestart, extendLeft, onShare, onLife, onCelebrate }) {
  if (!user.paid) return <FreeHome user={user} onRestart={onRestart} />;
  const used = 1.6; const limit = user.limitHours || 2;
  const pct = used / limit; const over = used > limit;
  const tip = pick(MENTOR);
  const connected = user.puckConnected !== false;
  return (
    <View style={{ flex: 1 }}>
      {/* full-screen artwork background */}
      <Image source={IMG.home} style={{ position: 'absolute', top: 0, left: 0, width: SCREEN_W, height: SCREEN_H }} resizeMode="cover" />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.dark ? 'rgba(16,18,13,0.5)' : 'rgba(245,242,234,0.45)' }} />
      <FloatingLeaves count={5} height={SCREEN_H} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {!connected && (
          <Pressable onPress={() => up && up({ puckConnected: true })} style={({ pressed }) => [{ marginTop: TOP, marginHorizontal: 16, backgroundColor: OVER, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.9 : 1 }]}>
            <Text style={{ fontSize: 20, marginRight: 11 }}>{'⚠️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 14.5, fontWeight: '800' }}>SAGE puck disconnected</Text>
              <Text style={{ color: '#fff', opacity: 0.92, fontSize: 12.5, marginTop: 2, lineHeight: 17 }}>You're unprotected — your limit won't buzz. Snap the puck back on your phone.</Text>
            </View>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, marginLeft: 8 }}>Reconnect {'›'}</Text>
          </Pressable>
        )}
        {/* nature header — the artwork now sits behind the whole screen */}
        <View style={{ height: connected ? 322 : 250 }}>
          <View style={{ position: 'absolute', top: TOP - 2, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ color: '#F5F2EA', fontSize: 14, textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 6 }}>{greet()},</Text>
              <Text style={{ color: '#F5F2EA', fontSize: 24, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 6 }}>{user.name || 'friend'}</Text>
            </View>
            <Pressable onPress={() => up && up({ puckConnected: !connected })} style={{ alignItems: 'center', backgroundColor: connected ? 'rgba(0,0,0,0.42)' : OVER, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 }}>
              <TinyLeaf size={20} color={connected ? '#7CE0A0' : '#fff'} />
              <Text style={{ color: '#F5F2EA', fontSize: 13, fontWeight: '800', marginTop: 3 }}>{connected ? '84%' : 'OFF'}</Text>
            </Pressable>
          </View>
          <Pressable onPress={onCelebrate} style={({ pressed }) => [{ position: 'absolute', top: TOP + 46, left: 0, right: 0, alignItems: 'center', opacity: pressed ? 0.85 : 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.42)', borderRadius: 100, paddingHorizontal: 15, paddingVertical: 8 }}>
              <Text style={{ fontSize: 14, marginRight: 7 }}>{'🔥'}</Text>
              <Text style={{ color: '#F5F2EA', fontSize: 13.5, fontWeight: '800' }}>{(user.streak ?? 12) > 0 ? `${user.streak ?? 12}-day streak` : 'Streak reset'}</Text>
              <Text style={{ color: '#E7D6A8', fontSize: 12.5, marginLeft: 8, fontWeight: '600' }}>{(user.streak ?? 12) > 0 ? 'keep going' : 'day 0 · start again'}</Text>
            </View>
          </Pressable>
          <View style={{ position: 'absolute', bottom: 2, left: 0, right: 0, alignItems: 'center' }}>
            <LeafChar onPress={onMentor} />
            <Pressable onPress={onMentor} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: T.card, borderWidth: 1, borderColor: T.line, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6, opacity: pressed ? 0.85 : 1 }]}>
              <Text style={{ color: T.text, fontSize: 11.5, fontWeight: '600' }}>Ask Sage</Text>
              <Text style={{ color: T.gold, fontSize: 12, marginLeft: 5 }}>{'›'}</Text>
            </Pressable>
          </View>
        </View>

        {/* daily line — relocated below the hero */}
        <Text style={{ color: T.goldSoft, fontSize: 14.5, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 30, marginTop: 18, lineHeight: 21 }}>{tip}</Text>

        <View style={{ paddingHorizontal: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 }}>
            <Pressable onPress={onShare} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderWidth: 1, borderColor: T.line, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7, opacity: pressed ? 0.85 : 1 }]}>
              <Text style={{ color: T.gold, fontSize: 14, fontWeight: '700' }}>{'↗'}</Text>
              <Text style={{ color: T.text, fontSize: 12.5, fontWeight: '600', marginLeft: 6 }}>Share stats</Text>
            </Pressable>
          </View>
          {extendLeft != null ? (
            <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 6 }}>
              <Ring pct={extendLeft / 900} size={230} stroke={16} color={OVER}>
                <Text style={{ color: T.text, fontSize: 44, fontWeight: '800' }}>{Math.floor(extendLeft / 60)}:{String(extendLeft % 60).padStart(2, '0')}</Text>
                <Text style={{ color: T.sub, fontSize: 13, marginTop: 2 }}>extra time</Text>
                <View style={{ marginTop: 10, backgroundColor: OVER + '22', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 }}>
                  <Text style={{ color: OVER, fontSize: 12, fontWeight: '800' }}>{'⚠'} streak at risk</Text>
                </View>
              </Ring>
              <Text style={{ color: T.sub, fontSize: 12, marginTop: 12 }}>put it down before the timer ends</Text>
            </View>
          ) : (
            <Pressable onPress={onLimit} style={{ alignItems: 'center', marginTop: 12, marginBottom: 6 }}>
              <Ring pct={pct} size={230} stroke={16} color={over ? OVER : T.gold}>
                <Text style={{ color: T.text, fontSize: 46, fontWeight: '800' }}>{fmtH(used)}</Text>
                <Text style={{ color: T.sub, fontSize: 14, marginTop: 2 }}>of {fmtH(limit)} today</Text>
                <View style={{ marginTop: 10, backgroundColor: (over ? OVER : T.good) + '22', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 }}>
                  <Text style={{ color: over ? OVER : T.good, fontSize: 12.5, fontWeight: '700' }}>{over ? 'over your line' : `${fmtH(limit - used)} left`}</Text>
                </View>
              </Ring>
              <Text style={{ color: T.sub, fontSize: 12, marginTop: 12 }}>tap to preview the limit moment {'›'}</Text>
            </Pressable>
          )}

          <View style={{ flexDirection: 'row', marginTop: 22, marginBottom: 8 }}>
            <PillarBubble id="focus" onPress={onPillar} />
            <PillarBubble id="sleep" onPress={onPillar} />
            <PillarBubble id="balance" onPress={onPillar} />
          </View>

          <SageNotes />

          <View style={{ marginTop: 14 }}><DistractingWidget /></View>
          <View style={{ marginTop: 14 }}><RankTrail onPress={onAchieve} /></View>

          <Pressable onPress={onRestart} style={{ alignSelf: 'center', marginTop: 26, padding: 8 }}>
            <Text style={{ color: T.sub, fontSize: 12.5 }}>{'↺'}  Restart demo</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Trends ───────────────────────────────────────────────────────────────────
const OVER = '#F0503C'; // dramatic red for bars crossing the limit line
const tlKey = (tl) => (tl === 'Daily' ? 'd' : tl === 'Weekly' ? 'w' : 'm');
const tlPeriod = (tl) => (tl === 'Daily' ? 'TODAY' : tl === 'Weekly' ? 'THIS WEEK' : 'THIS MONTH');
// App bubble — tap to pop out a full, readable insight card. Press gives a gentle scale so it feels alive.
function AppBubble({ app, tl, onOpen }) {
  const press = useRef(new Animated.Value(0)).current;
  const sc = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] });
  const hrs = app[tlKey(tl)];
  const abused = !app.necessity && hrs >= 0.7; // heavy app → Sage reaches out
  return (
    <Pressable
      onPressIn={() => Animated.spring(press, { toValue: 1, friction: 7, tension: 140, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(press, { toValue: 0, friction: 6, tension: 120, useNativeDriver: true }).start()}
      onPress={() => { hap('light'); onOpen(app, false); }}
      style={{ width: '31%', alignItems: 'center', marginBottom: 20 }}>
      {/* Sage leaf pops out of heavy apps — tap it to talk to Sage about this one. Spacer keeps bubbles aligned. */}
      {abused ? (
        <Pressable onPress={() => { hap('light'); onOpen(app, true); }} hitSlop={8} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.gold, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 5, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={{ fontSize: 10.5 }}>🌿</Text>
          <Text style={{ color: '#1E201B', fontSize: 9.5, fontWeight: '800', marginLeft: 3 }}>let's talk</Text>
        </Pressable>
      ) : <View style={{ height: 22, marginBottom: 5 }} />}
      <Animated.View style={{ width: 86, height: 74, alignItems: 'center', justifyContent: 'center', transform: [{ scale: sc }] }}>
        <AppIcon name={app.name} size={62} />
        {/* clear "there's more here" affordance — gold info dot on every bubble */}
        <View style={{ position: 'absolute', bottom: -2, right: 10, width: 20, height: 20, borderRadius: 10, backgroundColor: T.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: T.bg }}>
          <Text style={{ color: '#1E201B', fontSize: 11, fontWeight: '900' }}>i</Text>
        </View>
        {app.necessity ? <View style={{ position: 'absolute', top: -4, left: 6, backgroundColor: T.bg2, borderRadius: 7, paddingHorizontal: 5, paddingVertical: 1.5, borderWidth: 1, borderColor: T.line }}><Text style={{ color: T.sub, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.4 }}>NEEDED</Text></View> : null}
      </Animated.View>
      <Text style={{ color: T.text, fontSize: 12.5, fontWeight: '800', marginTop: 8 }}>{fmtH(hrs)}</Text>
      <Text style={{ color: T.sub, fontSize: 10 }} numberOfLines={1}>{app.name}</Text>
    </Pressable>
  );
}
// Pop-out insight card — springs up (premium). Shows the data, and lets you talk to Sage about this exact app.
function AppModal({ app, tl, onClose, startChat }) {
  if (!app) return null;
  const hrs = app[tlKey(tl)];
  const [chat, setChat] = useState(!!startChat);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (chat && msgs.length === 0) setMsgs([{ who: 'sage', text: `That's ${fmtH(app.w)} on ${app.name} this week. No judgment — want to bring it down, or figure out why you keep reaching for it?` }]);
  }, [chat]);
  const send = (text) => {
    const q = (text != null ? text : input).trim(); if (!q) return;
    setMsgs((m) => [...m, { who: 'you', text: q }]); setInput(''); setTyping(true);
    sageAI(`The user is talking about the app ${app.name}, where they spend about ${fmtH(app.w)} per week. They said: "${q.replace(/"/g, "'")}"`, { app: app.name, weekHours: app.w })
      .then((a) => { setMsgs((m) => [...m, { who: 'sage', text: a }]); setTyping(false); })
      .catch(() => { setMsgs((m) => [...m, { who: 'sage', text: mentorReply(q) }]); setTyping(false); });
  };
  return (
    <Pop onClose={onClose} width="100%">
      <View style={{ backgroundColor: T.card, borderRadius: 26, borderWidth: 1, borderColor: T.gold + '55', padding: 22 }}>
        <Pressable onPress={onClose} hitSlop={14} style={{ position: 'absolute', top: 14, right: 16, zIndex: 2 }}><Text style={{ color: T.sub, fontSize: 20 }}>{'✕'}</Text></Pressable>
        <View style={{ alignItems: 'center' }}>
          <AppIcon name={app.name} size={chat ? 54 : 78} />
          <Text style={{ color: T.text, fontSize: 20, fontWeight: '800', marginTop: 12 }}>{app.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
            <Text style={{ color: T.gold, fontSize: chat ? 22 : 34, fontWeight: '800' }}>{fmtH(hrs)}</Text>
            <Text style={{ color: T.sub, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginLeft: 8 }}>{tlPeriod(tl)}</Text>
          </View>
        </View>

        {!chat ? (
          <>
            <View style={{ height: 1, backgroundColor: T.line, alignSelf: 'stretch', marginVertical: 18 }} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'stretch' }}>
              <Text style={{ fontSize: 17, marginRight: 10 }}>{app.necessity ? '🌿' : '💡'}</Text>
              <Text style={{ color: T.text, fontSize: 15, lineHeight: 22, flex: 1 }}>{app.memo}</Text>
            </View>
            {app.necessity ? (
              <View style={{ marginTop: 18, alignSelf: 'stretch', backgroundColor: T.bg2, borderRadius: 14, borderWidth: 1, borderColor: T.line, padding: 13 }}>
                <Text style={{ color: T.sub, fontSize: 12.5, lineHeight: 18 }}><Text style={{ fontWeight: '900', color: T.text }}>Needed app.</Text> Tracked for your records, but never counted against your limit or streak.</Text>
              </View>
            ) : (
              <Pressable onPress={() => { hap('light'); setChat(true); }} style={({ pressed }) => [{ marginTop: 18, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: T.gold, borderRadius: 24, paddingVertical: 13, opacity: pressed ? 0.9 : 1 }]}>
                <Text style={{ fontSize: 15, marginRight: 7 }}>🌿</Text>
                <Text style={{ color: '#1E201B', fontSize: 14.5, fontWeight: '800' }}>Talk to Sage about {app.name}</Text>
              </Pressable>
            )}
          </>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ height: 1, backgroundColor: T.line, alignSelf: 'stretch', marginVertical: 14 }} />
            <ScrollView ref={ref} onContentSizeChange={() => ref.current && ref.current.scrollToEnd({ animated: true })} style={{ maxHeight: 240 }} contentContainerStyle={{ paddingBottom: 4 }} keyboardShouldPersistTaps="handled">
              {msgs.map((m, i) => {
                const me = m.who === 'you';
                return (
                  <View key={i} style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '86%', backgroundColor: me ? T.gold : T.bg2, borderWidth: me ? 0 : 1, borderColor: T.line, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10, marginBottom: 8 }}>
                    {me ? <Text style={{ color: '#1E201B', fontSize: 14, lineHeight: 20 }}>{m.text}</Text> : <Typewriter text={m.text} style={{ color: T.text, fontSize: 14, lineHeight: 20 }} />}
                  </View>
                );
              })}
              {typing && <View style={{ alignSelf: 'flex-start', backgroundColor: T.bg2, borderWidth: 1, borderColor: T.line, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10, marginBottom: 8 }}><Text style={{ color: T.sub, fontSize: 13 }}>Sage is thinking…</Text></View>}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <TextInput value={input} onChangeText={setInput} placeholder={`Tell Sage about ${app.name}…`} placeholderTextColor={T.sub} keyboardAppearance={T.dark ? 'dark' : 'light'} onSubmitEditing={() => send()} returnKeyType="send"
                style={{ flex: 1, backgroundColor: T.bg2, borderWidth: 1, borderColor: T.line, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, color: T.text, fontSize: 14.5, marginRight: 9 }} />
              <Pressable onPress={() => send()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: T.gold, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#1E201B', fontSize: 18, fontWeight: '800' }}>{'↑'}</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </Pop>
  );
}
// One app row (Apple "Most Used" style): icon, name, used vs its limit, and a progress bar.
function AppRow({ app, min, limitMin, topMin, onOpen }) {
  const over = limitMin != null && min > limitMin;
  const pct = limitMin != null ? Math.min(1, min / Math.max(1, limitMin)) : Math.min(1, min / Math.max(1, topMin));
  const fill = app.necessity ? T.sub : over ? OVER : T.gold;
  return (
    <Pressable onPress={() => { hap('light'); onOpen(app, false); }} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, opacity: pressed ? 0.8 : 1 }]}>
      <AppIcon name={app.name} size={40} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={{ color: T.text, fontSize: 14.5, fontWeight: '600', flex: 1 }} numberOfLines={1}>{app.name}</Text>
          {app.necessity ? (
            <Text style={{ color: T.sub, fontSize: 12.5 }}>{fmtMin(min)} · needed</Text>
          ) : (
            <Text style={{ fontSize: 13 }}><Text style={{ color: over ? OVER : T.text, fontWeight: '800' }}>{fmtMin(min)}</Text><Text style={{ color: T.sub }}> / {fmtMin(limitMin)}</Text></Text>
          )}
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: T.line, marginTop: 7, overflow: 'hidden' }}>
          <View style={{ height: 6, borderRadius: 3, width: `${Math.round(pct * 100)}%`, backgroundColor: fill }} />
        </View>
      </View>
      {over && !app.necessity ? (
        <Pressable onPress={() => { hap('light'); onOpen(app, true); }} hitSlop={8} style={{ marginLeft: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: T.gold, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14 }}>🌿</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}
// App list — mirrors whatever the chart above is showing (selected day or week).
function AppsSection({ appMin, scopeLabel, scopeDays, dailyLimit, struggleApps, showAll, setShowAll, onOpen }) {
  const rows = APP_USAGE.map((a) => ({ app: a, min: appMin(a) })).filter((r) => r.min > 0.5).sort((x, y) => y.min - x.min);
  const topMin = rows.length ? rows[0].min : 1;
  const shown = showAll ? rows : rows.slice(0, 5);
  return (
    <View style={{ marginTop: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 }}>
        <Text style={{ color: T.sub, fontSize: 12, letterSpacing: 2, fontWeight: '700', flex: 1 }}>MOST USED</Text>
        <Text style={{ color: T.gold, fontSize: 12, fontWeight: '700' }}>{scopeLabel}</Text>
      </View>
      <Text style={{ color: T.sub, fontSize: 11, marginBottom: 6 }}>Limits are set from your {fmtH(dailyLimit)} daily goal — social &amp; entertainment capped tightest. Tap an app for insight; 🌿 to talk to Sage.</Text>
      <Card style={{ paddingVertical: 2 }}>
        {shown.map(({ app, min }, i) => (
          <View key={app.name} style={{ borderBottomWidth: i === shown.length - 1 ? 0 : 1, borderColor: T.line }}>
            <AppRow app={app} min={min} limitMin={(() => { const d = appLimitMin(app, dailyLimit, struggleApps); return d == null ? null : d * (scopeDays || 1); })()} topMin={topMin} onOpen={onOpen} />
          </View>
        ))}
      </Card>
      {rows.length > 5 && (
        <Pressable onPress={() => { hap('light'); setShowAll((s) => !s); }} style={{ alignSelf: 'center', marginTop: 10, backgroundColor: T.card, borderWidth: 1, borderColor: T.line, borderRadius: 20, paddingVertical: 9, paddingHorizontal: 20 }}>
          <Text style={{ color: T.gold, fontSize: 13.5, fontWeight: '700' }}>{showAll ? 'Show less  ↑' : `Show all ${rows.length} apps  ↓`}</Text>
        </Pressable>
      )}
      <Text style={{ color: T.sub, fontSize: 10.5, textAlign: 'center', marginTop: 8 }}>Apps marked “needed” (texts, calls, mail, maps) are tracked but never capped.</Text>
    </View>
  );
}
// SAGE usage categories (earthy, on-brand) + this week's category minutes, Mon→Sun.
const CATS = [
  { key: 'Social', label: 'Social', color: '#C56B52' },       // clay
  { key: 'Entertainment', label: 'Entertainment', color: '#6FA8D6' }, // sky
  { key: 'Productivity', label: 'Work & Money', color: '#5FBF8A' },   // sage green
  { key: 'Other', label: 'Other', color: '#A89A7C' },          // sand
];
const BASE_WEEK = [
  { Social: 70,  Entertainment: 26, Productivity: 22, Other: 16 }, // Mon
  { Social: 118, Entertainment: 40, Productivity: 14, Other: 20 }, // Tue
  { Social: 52,  Entertainment: 18, Productivity: 20, Other: 13 }, // Wed
  { Social: 138, Entertainment: 44, Productivity: 10, Other: 17 }, // Thu
  { Social: 86,  Entertainment: 30, Productivity: 18, Other: 15 }, // Fri
  { Social: 40,  Entertainment: 16, Productivity: 12, Other: 11 }, // Sat
  { Social: 72,  Entertainment: 34, Productivity: 9,  Other: 13 }, // Sun
];
const DAYFULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOUR_W = [1, 1, 1, 1, 1, 2, 4, 8, 10, 9, 8, 9, 12, 11, 9, 8, 9, 11, 14, 16, 15, 12, 7, 3];
// Deterministic per-week variation so you can swipe back through plausible past weeks.
function weekData(offset) {
  if (offset === 0) return BASE_WEEK;
  return BASE_WEEK.map((d, i) => {
    const o = {};
    CATS.forEach((c, ci) => {
      const s = Math.sin(offset * 12.9898 + i * 78.233 + ci * 37.719) * 43758.5453;
      const frac = s - Math.floor(s);
      o[c.key] = Math.max(0, Math.round((d[c.key] || 0) * (0.6 + frac * 0.7)));
    });
    return o;
  });
}
const dayTotalMin = (week, i) => CATS.reduce((s, c) => s + (week[i][c.key] || 0), 0);
// One stacked bar: category-colored segments bottom→top. flat renders a single muted bar (unselected days).
function StackBar({ seg, total, maxV, width, chartH, flat }) {
  const h = Math.max(3, (total / maxV) * chartH);
  if (total <= 0) return <View style={{ width, height: 3, borderRadius: 1.5, backgroundColor: T.line }} />;
  if (flat) return <View style={{ width, height: h, borderRadius: Math.min(6, width / 2), backgroundColor: T.gold + '33' }} />;
  return (
    <View style={{ width, height: h, borderRadius: Math.min(6, width / 2), overflow: 'hidden' }}>
      {CATS.map((c) => { const mh = (seg[c.key] / total) * h; return mh > 0.4 ? <View key={c.key} style={{ height: mh, backgroundColor: c.color }} /> : null; })}
    </View>
  );
}
// Shared week bar chart (also the mini overview in Day view). onDayPress(i) decides what a tap does.
function WeekBars({ week, limit, sel, onDayPress, highlightOnly }) {
  const CH = 150;
  const limitMin = limit * 60;
  const weekMax = Math.max(limitMin, ...week.map((_, i) => dayTotalMin(week, i))) * 1.16;
  return (
    <>
      <View style={{ height: CH, position: 'relative' }}>
        <View style={{ position: 'absolute', left: 0, right: 34, top: CH * (1 - limitMin / weekMax), flexDirection: 'row', justifyContent: 'space-between' }}>
          {Array.from({ length: 22 }).map((_, i) => <View key={i} style={{ width: 6, height: 2, backgroundColor: T.gold, borderRadius: 1 }} />)}
        </View>
        <View style={{ position: 'absolute', right: 0, top: CH * (1 - limitMin / weekMax) - 7, width: 32, alignItems: 'flex-end' }}>
          <Text style={{ color: T.gold, fontSize: 10, fontWeight: '800' }}>{fmtH(limit)}</Text>
          <Text style={{ color: T.gold + 'AA', fontSize: 7.5, letterSpacing: 0.5, fontWeight: '800' }}>YOUR LINE</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: CH, paddingRight: 34 }}>
          {week.map((seg, i) => (
            <Pressable key={i} onPress={() => { hap('light'); onDayPress(i); }} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CH }}>
              <StackBar seg={seg} total={dayTotalMin(week, i)} maxV={weekMax} width={22} chartH={CH} flat={highlightOnly && i !== sel} />
            </Pressable>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', paddingRight: 34, marginTop: 7 }}>
        {DAYS.map((d, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', color: i === sel ? T.gold : T.sub, fontSize: 11, fontWeight: i === sel ? '800' : '400' }}>{d}</Text>)}
      </View>
    </>
  );
}
// Free mode: a deliberately thin chart — this week's totals only, one color, no categories/day/history.
function FreeUsageChart({ limit }) {
  const CH = 110;
  const limitMin = limit * 60;
  const avg = BASE_WEEK.reduce((s, _, i) => s + dayTotalMin(BASE_WEEK, i), 0) / 7;
  const weekMax = Math.max(limitMin, ...BASE_WEEK.map((_, i) => dayTotalMin(BASE_WEEK, i))) * 1.16;
  return (
    <Card>
      <Text style={{ color: T.sub, fontSize: 12.5 }}>Your average day</Text>
      <Text style={{ color: T.text, fontSize: 28, fontWeight: '800', marginBottom: 12 }}>{fmtH(avg / 60)}</Text>
      <View style={{ height: CH, position: 'relative' }}>
        <View style={{ position: 'absolute', left: 0, right: 34, top: CH * (1 - limitMin / weekMax), flexDirection: 'row', justifyContent: 'space-between' }}>
          {Array.from({ length: 22 }).map((_, i) => <View key={i} style={{ width: 6, height: 2, backgroundColor: T.gold, borderRadius: 1 }} />)}
        </View>
        <View style={{ position: 'absolute', right: 0, top: CH * (1 - limitMin / weekMax) - 7, width: 32, alignItems: 'flex-end' }}><Text style={{ color: T.gold, fontSize: 10, fontWeight: '800' }}>{fmtH(limit)}</Text></View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: CH, paddingRight: 34 }}>
          {BASE_WEEK.map((_, i) => { const t = dayTotalMin(BASE_WEEK, i); return <View key={i} style={{ flex: 1, alignItems: 'center' }}><View style={{ width: 22, height: Math.max(4, (t / weekMax) * CH), borderRadius: 6, backgroundColor: t > limitMin ? OVER : T.gold + 'AA' }} /></View>; })}
        </View>
      </View>
      <View style={{ flexDirection: 'row', paddingRight: 34, marginTop: 7 }}>{DAYS.map((d, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', color: T.sub, fontSize: 11 }}>{d}</Text>)}</View>
      <Text style={{ color: T.sub, fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 16 }}>Categories, daily detail and history unlock with membership.</Text>
    </Card>
  );
}
function UsageChart({ limit, paid, view, setView, weekOffset, setWeekOffset, sel, setSel }) {
  const CH = 118;
  if (!paid) return <FreeUsageChart limit={limit} />;
  const week = weekData(weekOffset);
  const prevWeek = weekData(weekOffset - 1);
  const avg = week.reduce((s, _, i) => s + dayTotalMin(week, i), 0) / 7;
  const prevAvg = prevWeek.reduce((s, _, i) => s + dayTotalMin(prevWeek, i), 0) / 7;
  const total = week.reduce((s, _, i) => s + dayTotalMin(week, i), 0);
  const delta = prevAvg > 0 ? Math.round(((avg - prevAvg) / prevAvg) * 100) : 0;
  const selTotal = dayTotalMin(week, sel);
  const scopeMin = (k) => (view === 'Week' ? week.reduce((s, _, i) => s + (week[i][k] || 0), 0) : (week[sel][k] || 0));
  const sw = HOUR_W.reduce((a, b) => a + b, 0);
  const hours = HOUR_W.map((wt) => { const seg = {}; CATS.forEach((c) => { seg[c.key] = (week[sel][c.key] || 0) * (wt / sw); }); return seg; });
  const hourTotals = hours.map((seg) => CATS.reduce((s, c) => s + seg[c.key], 0));
  const hourMax = Math.max(...hourTotals, 1) * 1.15;

  const daysAgo = (-weekOffset) * 7 + (6 - sel);
  const dayDate = new Date(Date.now() - daysAgo * 86400000);
  const dayLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : dayDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const weekLabel = weekOffset === 0 ? 'This week' : weekOffset === -1 ? 'Last week' : `${-weekOffset} weeks ago`;
  const canNewer = view === 'Week' ? weekOffset < 0 : daysAgo > 0;
  const older = () => {
    if (view === 'Week') { if (weekOffset > -12) setWeekOffset((w) => w - 1); }
    else if (sel > 0) setSel(sel - 1); else if (weekOffset > -12) { setWeekOffset((w) => w - 1); setSel(6); }
  };
  const newer = () => {
    if (view === 'Week') { if (weekOffset < 0) setWeekOffset((w) => w + 1); }
    else if (daysAgo > 0) { if (sel < 6) setSel(sel + 1); else if (weekOffset < 0) { setWeekOffset((w) => w + 1); setSel(0); } }
  };
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (e, g) => Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderRelease: (e, g) => { if (g.dx > 42) { hap('light'); older(); } else if (g.dx < -42 && canNewer) { hap('light'); newer(); } },
  });

  return (
    <Card>
      {/* Week / Day toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: T.bg2, borderRadius: 11, borderWidth: 1, borderColor: T.line, padding: 3, marginBottom: 14 }}>
        {['Week', 'Day'].map((v) => (
          <Pressable key={v} onPress={() => { hap('light'); setView(v); }} style={{ flex: 1, paddingVertical: 7, borderRadius: 9, backgroundColor: view === v ? T.gold : 'transparent', alignItems: 'center' }}>
            <Text style={{ color: view === v ? '#1E201B' : T.sub, fontSize: 13, fontWeight: '700' }}>{v}</Text>
          </Pressable>
        ))}
      </View>

      {/* period navigator — chevrons + swipe */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Pressable onPress={() => { hap('light'); older(); }} hitSlop={10} style={{ padding: 4 }}><Text style={{ color: T.gold, fontSize: 20, fontWeight: '700' }}>{'‹'}</Text></Pressable>
        <Text style={{ flex: 1, textAlign: 'center', color: T.sub, fontSize: 12.5, letterSpacing: 0.5, fontWeight: '700' }}>{view === 'Week' ? weekLabel : dayLabel}</Text>
        <Pressable onPress={() => { if (canNewer) { hap('light'); newer(); } }} hitSlop={10} style={{ padding: 4, opacity: canNewer ? 1 : 0.25 }}><Text style={{ color: T.gold, fontSize: 20, fontWeight: '700' }}>{'›'}</Text></Pressable>
      </View>

      <View {...pan.panHandlers}>
      {view === 'Week' ? (
        <>
          <Text style={{ color: T.sub, fontSize: 12.5 }}>Your average day</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: T.text, fontSize: 30, fontWeight: '800', flex: 1 }}>{fmtH(avg / 60)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: (delta <= 0 ? T.good : OVER) + '1F', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ color: delta <= 0 ? T.good : OVER, fontSize: 12.5, fontWeight: '800' }}>{delta <= 0 ? '↓' : '↑'} {Math.abs(delta)}% vs last week</Text>
            </View>
          </View>
          <WeekBars week={week} limit={limit} sel={sel} highlightOnly={false} onDayPress={(i) => { setSel(i); setView('Day'); }} />
          <Text style={{ color: T.sub, fontSize: 11, textAlign: 'center', marginTop: 8 }}>tap a day to open it · swipe for other weeks</Text>
        </>
      ) : (
        <>
          <Text style={{ color: T.text, fontSize: 30, fontWeight: '800', marginBottom: 12 }}>{fmtH(selTotal / 60)}</Text>
          <WeekBars week={week} limit={limit} sel={sel} highlightOnly={true} onDayPress={(i) => setSel(i)} />
          <View style={{ height: CH, marginTop: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: CH }}>
              {hours.map((seg, h) => <StackBar key={h} seg={seg} total={hourTotals[h]} maxV={hourMax} width={7} chartH={CH} />)}
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}>
            {['12 AM', '6 AM', '12 PM', '6 PM', '11 PM'].map((t) => <Text key={t} style={{ color: T.sub, fontSize: 10 }}>{t}</Text>)}
          </View>
          <Text style={{ color: T.sub, fontSize: 11, textAlign: 'center', marginTop: 8 }}>swipe for other days</Text>
        </>
      )}

      {/* category legend — SAGE earthy tones */}
      <View style={{ flexDirection: 'row', marginTop: 16, borderTopWidth: 1, borderColor: T.line, paddingTop: 14 }}>
        {CATS.slice(0, 3).map((c) => (
          <View key={c.key} style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: c.color, marginRight: 6 }} />
              <Text style={{ color: T.sub, fontSize: 11.5, fontWeight: '600' }} numberOfLines={1}>{c.label}</Text>
            </View>
            <Text style={{ color: T.text, fontSize: 14.5, fontWeight: '800' }}>{fmtH(scopeMin(c.key) / 60)}</Text>
          </View>
        ))}
      </View>
      {view === 'Week' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, borderTopWidth: 1, borderColor: T.line, paddingTop: 12 }}>
          <Text style={{ color: T.text, fontSize: 14, fontWeight: '600', flex: 1 }}>Week total</Text>
          <Text style={{ color: T.gold, fontSize: 14.5, fontWeight: '800' }}>{fmtH(total / 60)}</Text>
        </View>
      )}
      </View>
    </Card>
  );
}
function Trends({ user, onReport, onTracker }) {
  const [view, setView] = useState('Week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selDay, setSelDay] = useState(6);
  const [showAll, setShowAll] = useState(false);
  const [appSel, setAppSel] = useState(null);
  const limit = user.limitHours || 2;
  const week = weekData(weekOffset);
  // Each app's minutes for the scope the chart is showing — tied to the chart's own category totals.
  const appMin = (app) => {
    const inCat = APP_USAGE.filter((a) => a.cat === app.cat);
    const denom = inCat.reduce((s, a) => s + a.w, 0) || 1;
    const share = app.w / denom;
    if (view === 'Day') return (week[selDay][app.cat] || 0) * share;
    return week.reduce((s, _, i) => s + (week[i][app.cat] || 0), 0) * share;
  };
  const daysAgo = (-weekOffset) * 7 + (6 - selDay);
  const dayDate = new Date(Date.now() - daysAgo * 86400000);
  const scopeLabel = view === 'Week'
    ? (weekOffset === 0 ? 'This week' : weekOffset === -1 ? 'Last week' : `${-weekOffset} weeks ago`)
    : (daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : dayDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
  return (
    <View style={{ flex: 1 }}>
      <Image source={IMG.pond} style={{ position: 'absolute', top: 0, left: 0, width: SCREEN_W, height: SCREEN_H }} resizeMode="cover" />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.dark ? 'rgba(16,18,13,0.62)' : 'rgba(245,242,234,0.55)' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: TOP, paddingHorizontal: 22, paddingBottom: 120 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ color: T.text, fontSize: 26, fontWeight: '700', flex: 1 }}>Trends</Text>
        {user.paid && (
          <Pressable onPress={onReport} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderWidth: 1, borderColor: T.line, borderRadius: 100, paddingHorizontal: 13, paddingVertical: 7, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={{ color: T.gold, fontSize: 12.5, fontWeight: '700' }}>This week's report  {'›'}</Text>
          </Pressable>
        )}
      </View>

      <UsageChart limit={limit} paid={user.paid} view={view} setView={setView} weekOffset={weekOffset} setWeekOffset={setWeekOffset} sel={selDay} setSel={setSelDay} />

      {user.paid ? (
        <AppsSection appMin={appMin} scopeLabel={scopeLabel} scopeDays={view === 'Week' ? 7 : 1} dailyLimit={limit} struggleApps={user.struggleApps} showAll={showAll} setShowAll={setShowAll} onOpen={(a, c) => setAppSel({ app: a, chat: c })} />
      ) : (
        <View style={{ marginTop: 16 }}>
          <LockCard title="This is the mirror. The coaching is the point." line="Free SAGE shows you this week's totals. The per-app breakdown, daily detail, your limits and the insights that tell you what to do next wake up with your membership." cta="Unlock insights" />
        </View>
      )}
      </ScrollView>
      {showAll && !appSel ? (
        <Fade style={{ position: 'absolute', left: 0, right: 0, bottom: 104, alignItems: 'center' }}>
          <Pressable onPress={() => { hap('light'); setShowAll(false); }} style={{ backgroundColor: T.gold, borderRadius: 22, paddingVertical: 11, paddingHorizontal: 26, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
            <Text style={{ color: '#1E201B', fontSize: 13.5, fontWeight: '800' }}>Show less  ↑</Text>
          </Pressable>
        </Fade>
      ) : null}
      {appSel ? <AppModal app={appSel.app} startChat={appSel.chat} tl={view === 'Day' ? 'Daily' : 'Weekly'} onClose={() => setAppSel(null)} /> : null}
    </View>
  );
}

// ── Circle ───────────────────────────────────────────────────────────────────
function MiniWeek({ m }) {
  const max = Math.max(...m.week, m.limit) * 1.15;
  const CH = 70;
  return (
    <View>
      <View style={{ height: CH, position: 'relative' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: CH * (1 - m.limit / max), borderTopWidth: 1, borderColor: T.gold + '99', borderStyle: 'dashed' }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: CH }}>
          {m.week.map((h, i) => {
            const over = h > m.limit;
            return <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CH }}>
              <View style={{ width: 12, height: Math.max(4, (h / max) * CH), borderRadius: 4, backgroundColor: over ? OVER : T.gold + 'AA' }} />
            </View>;
          })}
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {DAYS.map((d, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', color: T.sub, fontSize: 10 }}>{d}</Text>)}
      </View>
    </View>
  );
}
function InviteModal({ onClose }) {
  const [code, setCode] = useState('');
  return (
    <Pop onClose={onClose} width="100%">
      <View style={{ width: '100%', backgroundColor: T.card, borderRadius: 24, borderWidth: 1, borderColor: T.line, padding: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <SageMark size={24} />
          <Text style={{ color: T.text, fontSize: 19, fontWeight: '800', marginLeft: 8 }}>Grow your Circle</Text>
          <Pressable onPress={onClose} hitSlop={12} style={{ marginLeft: 'auto' }}><Text style={{ color: T.sub, fontSize: 20 }}>{'✕'}</Text></Pressable>
        </View>
        <Text style={{ color: T.sub, fontSize: 13.5, lineHeight: 20, marginBottom: 16 }}>Send a friend your link — one tap and they're in.</Text>
        <Pressable onPress={async () => { try { await Share.share({ message: 'Join my Circle on SAGE — we keep each other under our screen-time limits. sageband.co/j/8241' }); } catch (e) {} }} style={{ backgroundColor: T.bg2, borderRadius: 14, borderWidth: 1, borderColor: T.line, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: T.text, fontSize: 14, flex: 1 }}>sageband.co/j/8241</Text>
          <Text style={{ color: T.gold, fontSize: 12.5, fontWeight: '800' }}>SHARE</Text>
        </Pressable>
        <Btn label="Share invite link" onPress={async () => { try { await Share.share({ message: 'Join my Circle on SAGE — we keep each other under our screen-time limits. sageband.co/j/8241' }); } catch (e) {} }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 18 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: T.line }} />
          <Text style={{ color: T.sub, fontSize: 12, marginHorizontal: 10 }}>or join a Circle</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: T.line }} />
        </View>
        <Text style={{ color: T.sub, fontSize: 12.5, marginBottom: 8 }}>No link? Enter their 4-digit code:</Text>
        <TextInput value={code} onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="0000" placeholderTextColor={T.sub} keyboardType="number-pad" keyboardAppearance={T.dark ? 'dark' : 'light'} maxLength={4}
          style={{ backgroundColor: T.bg2, borderWidth: 1.5, borderColor: code.length === 4 ? T.gold : T.line, borderRadius: 14, paddingVertical: 14, textAlign: 'center', color: T.text, fontSize: 26, fontWeight: '800', letterSpacing: 10 }} />
        <View style={{ marginTop: 12 }}>
          <Btn label="Join Circle" subtle disabled={code.length !== 4} onPress={onClose} />
        </View>
      </View>
    </Pop>
  );
}
function CircleTab({ user }) {
  const [open, setOpen] = useState(null);
  const [sent, setSent] = useState(null);
  const [invite, setInvite] = useState(false);
  const nudge = (name, emoji) => { hap('light'); setSent(`Sent ${emoji} to ${name}`); setTimeout(() => setSent(null), 2200); };
  return (
    <View style={{ flex: 1 }}>
      <Image source={IMG.circle} style={{ position: 'absolute', top: 0, left: 0, width: SCREEN_W, height: SCREEN_H }} resizeMode="cover" />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.dark ? 'rgba(16,18,13,0.62)' : 'rgba(245,242,234,0.55)' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: TOP, paddingHorizontal: 22, paddingBottom: 120 }}>
        <Text style={{ color: T.text, fontSize: 26, fontWeight: '700', marginBottom: 4 }}>Circle</Text>
        <Text style={{ color: T.sub, fontSize: 14, marginBottom: 20 }}>Quiet accountability. Everyone opts in.</Text>

        {!user.paid ? (
          <LockCard title="Accountability is a membership perk." line="Your Circle keeps you honest — streaks, gentle nudges, and the people you love cheering you on. It wakes up when SAGE is active." cta="Unlock Circle" />
        ) : CIRCLE.map((m, i) => {
          const isOpen = open === i;
          const emojis = m.under ? ['👏', '🔥', '💪'] : ['😅', '👀', '⏰'];
          return (
            <Card key={i} style={{ marginBottom: 10 }}>
              <Pressable onPress={() => setOpen(isOpen ? null : i)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: T.bg2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: T.text, fontSize: 16, fontWeight: '700' }}>{m.name[0]}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: T.text, fontSize: 15, fontWeight: '600' }}>{m.name}</Text>
                  <Text style={{ color: T.sub, fontSize: 12.5, marginTop: 2 }}>{fmtH(m.hrs)} today {'·'} {m.streak}-day streak</Text>
                </View>
                <View style={{ backgroundColor: (m.under ? T.good : OVER) + '22', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, marginRight: 10 }}>
                  <Text style={{ color: m.under ? T.good : OVER, fontSize: 11.5, fontWeight: '700' }}>{m.under ? 'under' : 'over'}</Text>
                </View>
                <Text style={{ color: T.sub, fontSize: 16 }}>{isOpen ? '⌃' : '⌄'}</Text>
              </Pressable>
              {isOpen && (
                <View style={{ marginTop: 18, borderTopWidth: 1, borderColor: T.line, paddingTop: 16 }}>
                  <MiniWeek m={m} />
                  <View style={{ flexDirection: 'row', marginTop: 16 }}>
                    {[['Limit', fmtH(m.limit)], ['Longest focus', m.focus], ['Pickups', String(m.pickups)]].map(([k, v], j) => (
                      <View key={j} style={{ flex: 1 }}>
                        <Text style={{ color: T.text, fontSize: 16, fontWeight: '800' }}>{v}</Text>
                        <Text style={{ color: T.sub, fontSize: 11, marginTop: 2 }}>{k}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ color: T.sub, fontSize: 11, letterSpacing: 1.5, fontWeight: '700', marginTop: 18, marginBottom: 10 }}>TOP APPS</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {m.apps.map(([an, ah]) => (
                      <View key={an} style={{ alignItems: 'center', flex: 1 }}>
                        <AppIcon name={an} size={42} />
                        <Text style={{ color: T.text, fontSize: 11.5, fontWeight: '700', marginTop: 6 }}>{fmtH(ah)}</Text>
                        <Text style={{ color: T.sub, fontSize: 9 }} numberOfLines={1}>{an}</Text>
                      </View>
                    ))}
                  </View>
                  {m.name !== 'You' && (
                    <View style={{ marginTop: 18, backgroundColor: T.gold + '14', borderWidth: 1, borderColor: T.gold + '55', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 14, alignItems: 'center' }}>
                      <Text style={{ color: T.gold, fontSize: 11.5, letterSpacing: 1, fontWeight: '800', marginBottom: 12, textAlign: 'center' }}>NUDGE {m.name.toUpperCase()} — TAP TO SEND A PING</Text>
                      <View style={{ flexDirection: 'row', gap: 18, justifyContent: 'center' }}>
                        {emojis.map((e) => (
                          <Pressable key={e} onPress={() => nudge(m.name, e)} style={({ pressed }) => [{ width: 58, height: 58, borderRadius: 29, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.gold + '77', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
                            <Text style={{ fontSize: 30 }}>{e}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </Card>
          );
        })}

        {user.paid && (
          <Pressable onPress={() => setInvite(true)} style={({ pressed }) => [{ marginTop: 8, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: T.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', opacity: pressed ? 0.85 : 1 }]}>
            <Text style={{ color: T.gold, fontSize: 22, fontWeight: '700', marginRight: 8 }}>+</Text>
            <Text style={{ color: T.gold, fontSize: 16, fontWeight: '700' }}>Invite to your Circle</Text>
          </Pressable>
        )}
      </ScrollView>

      {sent && (
        <View pointerEvents="none" style={{ position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center' }}>
          <View style={{ backgroundColor: T.gold, borderRadius: 100, paddingHorizontal: 18, paddingVertical: 10 }}>
            <Text style={{ color: '#1E201B', fontWeight: '800' }}>{sent}</Text>
          </View>
        </View>
      )}
      {invite && <InviteModal onClose={() => setInvite(false)} />}
    </View>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────
function Row({ label, value, onPress, last }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: last ? 0 : 1, borderColor: T.line }}>
      <Text style={{ color: T.text, fontSize: 15, flex: 1 }}>{label}</Text>
      {value != null && <Text style={{ color: T.sub, fontSize: 14, marginRight: 6 }}>{value}</Text>}
      {onPress && <Text style={{ color: T.sub, fontSize: 18 }}>{'›'}</Text>}
    </Pressable>
  );
}
function ToggleRow({ label, value, onChange, last }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderColor: T.line }}>
      <Text style={{ color: T.text, fontSize: 15, flex: 1 }}>{label}</Text>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
}
function Seg({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: T.bg2, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: T.line }}>
      {options.map((o) => {
        const on = o.k === value;
        return (
          <Pressable key={o.k} onPress={() => { onChange(o.k); }} style={{ flex: 1, paddingVertical: 11, borderRadius: 11, backgroundColor: on ? T.gold : 'transparent', alignItems: 'center' }}>
            <Text style={{ color: on ? '#1E201B' : T.text, fontWeight: on ? '700' : '500', fontSize: 14 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
// Big draggable daily-limit control with live guidance and a Save confirm.
function LimitSlider({ value0, onSave }) {
  const MIN = 1, MAX = 8, STEP = 0.25;
  const [w, setW] = useState(0);
  const [val, setVal] = useState(value0);
  const wRef = useRef(0), valRef = useRef(value0), startRef = useRef(value0);
  wRef.current = w; valRef.current = val;
  useEffect(() => { setVal(value0); }, [value0]);
  const pct = (val - MIN) / (MAX - MIN);
  const note = (v) => v <= 1.5 ? 'Elite — very few live here. You’ll fight for every day.'
    : v <= 2.5 ? 'Strong. A focused, intentional life.'
    : v <= 3.5 ? 'A healthy balance for most people.'
    : v <= 5 ? 'Average — there are real hours to win back here.'
    : 'High. Let’s bring this down together, a little at a time.';
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { startRef.current = valRef.current; hap('light'); },
    onPanResponderMove: (e, g) => {
      if (!wRef.current) return;
      let nv = startRef.current + (g.dx / wRef.current) * (MAX - MIN);
      nv = Math.max(MIN, Math.min(MAX, Math.round(nv / STEP) * STEP));
      if (nv !== valRef.current) { valRef.current = nv; setVal(nv); }
    },
  })).current;
  const dirty = Math.abs(val - value0) > 0.001;
  return (
    <Card>
      <Text style={{ color: T.sub, fontSize: 12.5 }}>Daily screen-time limit</Text>
      <Text style={{ color: T.gold, fontSize: 36, fontWeight: '800', marginTop: 2, marginBottom: 14 }}>{fmtH(val)}</Text>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: 40, justifyContent: 'center' }} {...pan.panHandlers}>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: T.line }}>
          <View style={{ height: 8, borderRadius: 4, width: `${pct * 100}%`, backgroundColor: T.gold }} />
        </View>
        <View style={{ position: 'absolute', left: Math.max(0, Math.min(w - 26, pct * w - 13)), width: 26, height: 26, borderRadius: 13, backgroundColor: T.gold, borderWidth: 3, borderColor: T.bg, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ color: T.sub, fontSize: 10.5 }}>1h</Text>
        <Text style={{ color: T.sub, fontSize: 10.5 }}>8h</Text>
      </View>
      <Text style={{ color: T.text, fontSize: 13.5, lineHeight: 19, marginTop: 12 }}>{note(val)}</Text>
      <View style={{ marginTop: 14 }}>
        <Btn label={dirty ? `Save ${fmtH(val)} limit` : 'Saved ✓'} disabled={!dirty} onPress={() => { hap('success'); onSave(val); }} />
      </View>
    </Card>
  );
}
function Settings({ user, up, themeKey, setTheme, onRestart, onApps }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: TOP, paddingHorizontal: 22, paddingBottom: 120 }}>
      <Text style={{ color: T.text, fontSize: 26, fontWeight: '700', marginBottom: 20 }}>Settings</Text>

      <Text style={{ color: T.sub, fontSize: 12, letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>DAILY LIMIT</Text>
      <LimitSlider value0={user.limitHours || 2} onSave={(v) => up({ limitHours: v })} />

      <Text style={{ color: T.sub, fontSize: 12, letterSpacing: 2, fontWeight: '700', marginTop: 24, marginBottom: 10 }}>APPEARANCE</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {Object.values(THEMES).map((th) => {
          const on = th.key === themeKey;
          return (
            <Pressable key={th.key} onPress={() => { hap('select'); setTheme(th.key); }} style={{ flex: 1 }}>
              <View style={{ height: 58, borderRadius: 15, backgroundColor: th.bg, borderWidth: on ? 2 : 1, borderColor: on ? T.gold : T.line, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: th.gold }} />
              </View>
              <Text style={{ color: on ? T.gold : T.sub, fontSize: 11, textAlign: 'center', marginTop: 6, fontWeight: on ? '700' : '400' }}>{th.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {/* anti-blue-light — a richer, tappable card with a warm sunset accent */}
      <Pressable onPress={() => { hap('select'); up({ redLight: !user.redLight }); }} style={({ pressed }) => [{ marginTop: 10, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: user.redLight ? '#E8945A' : T.line, opacity: pressed ? 0.92 : 1 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: user.redLight ? '#F4C98E22' : T.card, paddingHorizontal: 16, paddingVertical: 14 }}>
          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: user.redLight ? '#E8945A' : T.bg2, borderWidth: user.redLight ? 0 : 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Text style={{ fontSize: 21 }}>{user.redLight ? '🌙' : '☀️'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: T.text, fontSize: 15, fontWeight: '800' }}>Anti-blue-light mode</Text>
            <Text style={{ color: T.sub, fontSize: 12, marginTop: 2 }}>{user.redLight ? 'Warm filter on — kinder on your sleep' : 'Warm the screen to protect your sleep'}</Text>
          </View>
          <Toggle value={!!user.redLight} onChange={(v) => up({ redLight: v })} />
        </View>
      </Pressable>
      {user.redLight && <Text style={{ color: T.sub, fontSize: 11.5, marginTop: 8, lineHeight: 17 }}>A warm filter now covers the app to protect your sleep. For a system-wide red screen, also turn on iOS Settings → Accessibility → Color Filters.</Text>}

      <Text style={{ color: T.sub, fontSize: 12, letterSpacing: 2, fontWeight: '700', marginTop: 24, marginBottom: 8 }}>YOUR PUCK</Text>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput value={user.puck} onChangeText={(t) => up({ puck: t })} placeholder="Sage" placeholderTextColor={T.sub} keyboardAppearance={T.dark ? 'dark' : 'light'}
            style={{ flex: 1, color: T.text, fontSize: 17, fontWeight: '700', paddingVertical: 2 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: user.puckConnected !== false ? T.good : OVER, marginRight: 7 }} />
            <Text style={{ color: T.sub, fontSize: 14, fontWeight: '600' }}>{user.puckConnected !== false ? '84%' : 'Off'}</Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: T.line, marginVertical: 14 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: T.text, fontSize: 14, fontWeight: '600', flex: 1 }}>Connection {'·'} <Text style={{ color: user.puckConnected !== false ? T.good : OVER, fontWeight: '800' }}>{user.puckConnected !== false ? 'Connected' : 'Disconnected'}</Text></Text>
          <Toggle value={user.puckConnected !== false} onChange={(v) => up({ puckConnected: v })} />
        </View>
      </Card>

      <Text style={{ color: T.sub, fontSize: 12, letterSpacing: 2, fontWeight: '700', marginTop: 24, marginBottom: 8 }}>APPS & ACCESS</Text>
      <Card style={{ paddingVertical: 2 }}>
        <Row label="Monitored apps" value={(user.struggleApps || []).length === APPS.length ? 'ALL' : String((user.struggleApps || []).length)} onPress={onApps} />
        <ToggleRow label="Notifications" value={user.notif !== false} onChange={(v) => up({ notif: v })} last />
      </Card>

      <Text style={{ color: T.sub, fontSize: 12, letterSpacing: 2, fontWeight: '700', marginTop: 24, marginBottom: 8 }}>MEMBERSHIP</Text>
      <Pressable onPress={() => { hap('select'); up({ paid: !user.paid }); }} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: user.paid ? T.gold + '18' : T.card, borderRadius: 14, borderWidth: 1, borderColor: user.paid ? T.gold : T.line, paddingHorizontal: 16, paddingVertical: 13 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: T.text, fontSize: 15, fontWeight: '700' }}>{user.paid ? 'SAGE is active' : 'Free mode'}</Text>
          <Text style={{ color: T.sub, fontSize: 12, marginTop: 2 }}>{user.paid ? 'Yearly · full mentor unlocked' : 'Tracking only — mentor is asleep'}</Text>
        </View>
        <Toggle value={!!user.paid} onChange={(v) => up({ paid: v })} />
      </Pressable>
      <Text style={{ color: T.sub, fontSize: 11, marginTop: 8, lineHeight: 16 }}>Demo switch — flip this to preview exactly what a non-subscriber sees. Real purchases happen at sageband.co.</Text>
      <Card style={{ paddingVertical: 2, marginTop: 10 }}>
        <Row label={user.paid ? 'Plan' : 'Status'} value={user.paid ? 'Yearly · $149' : 'Not subscribed'} />
        <Row label={user.paid ? 'Manage or cancel' : 'Start membership'} onPress={() => Linking.openURL('https://sageband.co')} last />
      </Card>

      {BACKEND_READY && (
        <>
          <Text style={{ color: T.sub, fontSize: 12, letterSpacing: 2, fontWeight: '700', marginTop: 24, marginBottom: 8 }}>ACCOUNT</Text>
          <Card style={{ paddingVertical: 2 }}>
            <Row label="Signed in as" value={(SESSION && SESSION.user && SESSION.user.email) || '—'} />
            <Row label="Sign out" onPress={onRestart} />
            <Row label="Delete account" onPress={() => Alert.alert('Delete account?', 'This permanently removes your account and all your data. This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await authDeleteAccount(); } catch (e) {} onRestart(); } }])} last />
          </Card>
          <Text style={{ color: T.sub, fontSize: 11, marginTop: 8, lineHeight: 16 }}>Deleting your account permanently removes your data.</Text>
        </>
      )}

      <View style={{ marginTop: 24 }}>
        <Btn label="Restart demo — re-run setup" subtle onPress={onRestart} />
      </View>

      <View style={{ alignItems: 'center', marginTop: 28 }}>
        <Wordmark size={28} />
        <Text style={{ color: T.sub, fontSize: 12, marginTop: 6 }}>v10 {'·'} sageband.co</Text>
      </View>
    </ScrollView>
  );
}
function AppsManager({ user, up, onBack }) {
  const list = user.struggleApps || [];
  const toggle = (a) => { up({ struggleApps: list.includes(a) ? list.filter((x) => x !== a) : [...list, a] }); };
  return (
    <Fade style={{ backgroundColor: T.bg }}>
      <View style={{ flex: 1, paddingTop: TOP + 8, paddingHorizontal: 22 }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ marginBottom: 16 }}><Text style={{ color: T.sub, fontSize: 15 }}>{'‹'}  Back</Text></Pressable>
        <Text style={{ color: T.text, fontSize: 26, fontWeight: '700' }}>Monitored apps</Text>
        <Text style={{ color: T.sub, fontSize: 14, marginTop: 6, marginBottom: 16 }}>Tap to add or remove. These count against your limit.</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {(() => {
            const allOn = list.length === APPS.length;
            return (
              <Pressable onPress={() => { up({ struggleApps: allOn ? [] : [...APPS] }); }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: allOn ? T.gold : T.line, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 14 }}>
                <SageMark size={22} />
                <Text style={{ color: T.text, fontSize: 15.5, fontWeight: '700', flex: 1, marginLeft: 12 }}>Monitor all apps</Text>
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: allOn ? T.gold : 'transparent', borderWidth: 1.5, borderColor: allOn ? T.gold : T.line }}>
                  <Text style={{ color: allOn ? '#1E201B' : T.sub, fontSize: 12.5, fontWeight: '700' }}>{allOn ? 'On' : 'Off'}</Text>
                </View>
              </Pressable>
            );
          })()}
          {APPS.map((a, i) => {
            const on = list.includes(a);
            return (
              <Pressable key={a} onPress={() => toggle(a)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: i === APPS.length - 1 ? 0 : 1, borderColor: T.line }}>
                <Text style={{ color: T.text, fontSize: 15.5, flex: 1 }}>{a}</Text>
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: on ? T.gold : 'transparent', borderWidth: 1.5, borderColor: on ? T.gold : T.line }}>
                  <Text style={{ color: on ? '#1E201B' : T.sub, fontSize: 12.5, fontWeight: '700' }}>{on ? 'Watching' : 'Off'}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Fade>
  );
}

// ── Tracker detail / Achievements / Weekly report ────────────────────────────
function TrackerDetail({ t, onBack }) {
  return (
    <Fade style={{ backgroundColor: T.bg }}>
      <View style={{ flex: 1, paddingTop: TOP + 8, paddingHorizontal: 26 }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ marginBottom: 24 }}><Text style={{ color: T.sub, fontSize: 15 }}>{'‹'}  Back</Text></Pressable>
        <Text style={{ color: T.gold, letterSpacing: 2, fontSize: 12, fontWeight: '700' }}>{t.label.toUpperCase()}</Text>
        <Text style={{ color: t.good ? T.good : T.bad, fontSize: 64, fontWeight: '800', marginVertical: 8 }}>{t.value}</Text>
        <Text style={{ color: T.text, fontSize: 16, lineHeight: 25 }}>{t.desc}</Text>
        <Card style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center' }}>
          <SageMark size={28} />
          <Text style={{ color: T.text, fontSize: 14, marginLeft: 12, flex: 1, lineHeight: 20, fontStyle: 'italic' }}>{pick(COACH)}</Text>
        </Card>
      </View>
    </Fade>
  );
}
function PillarDetail({ id, onBack }) {
  const [cur, setCur] = useState(id);
  const p = PILLARS[cur];
  const keys = ['focus', 'sleep', 'balance'];
  return (
    <Fade style={{ backgroundColor: T.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: TOP + 8, paddingHorizontal: 26, paddingBottom: 40 }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ marginBottom: 16 }}><Text style={{ color: T.sub, fontSize: 15 }}>{'‹'}  Back</Text></Pressable>
        <View style={{ flexDirection: 'row', backgroundColor: T.bg2, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: T.line, marginBottom: 22 }}>
          {keys.map((k) => {
            const on = k === cur;
            return (
              <Pressable key={k} onPress={() => setCur(k)} style={{ flex: 1, paddingVertical: 9, borderRadius: 11, backgroundColor: on ? PILLARS[k].accent : 'transparent', alignItems: 'center' }}>
                <Text style={{ color: on ? '#1E201B' : T.text, fontWeight: on ? '700' : '500', fontSize: 13.5 }}>{PILLARS[k].label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Ring pct={p.score / 100} size={152} stroke={12} color={p.accent} track={T.line}>
            <Text style={{ color: T.text, fontSize: 42, fontWeight: '800' }}>{p.score}</Text>
            <Text style={{ color: T.sub, fontSize: 11 }}>/ 100</Text>
          </Ring>
          <Text style={{ color: p.accent, fontSize: 21, fontWeight: '800', marginTop: 16 }}>{p.label}</Text>
          <Text style={{ color: T.sub, fontSize: 14.5, marginTop: 6, textAlign: 'center' }}>{p.line}</Text>
        </View>
        <Card style={{ marginTop: 16, paddingVertical: 4 }}>
          {p.rows.map(([k, v], i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: i === p.rows.length - 1 ? 0 : 1, borderColor: T.line }}>
              <Text style={{ color: T.sub, fontSize: 14.5, flex: 1 }}>{k}</Text>
              <Text style={{ color: T.text, fontSize: 15, fontWeight: '700' }}>{v}</Text>
            </View>
          ))}
        </Card>
        <Card style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center' }}>
          <SageMark size={26} />
          <Text style={{ color: T.text, fontSize: 14, marginLeft: 12, flex: 1, lineHeight: 20, fontStyle: 'italic' }}>{pick(COACH)}</Text>
        </Card>
      </ScrollView>
    </Fade>
  );
}
function TypingLeaf() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 360, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(a, { toValue: -1, duration: 360, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 360, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);
  const rotate = a.interpolate({ inputRange: [-1, 1], outputRange: ['-24deg', '24deg'] });
  const ty = a.interpolate({ inputRange: [-1, 1], outputRange: [2, -4] });
  return (
    <Animated.View style={{ transform: [{ translateY: ty }, { rotate }] }}>
      <TinyLeaf size={20} color={T.good} />
    </Animated.View>
  );
}
function Mentor({ user, onBack }) {
  const [msgs, setMsgs] = useState([{ who: 'sage', text: `Hey ${user.name || 'there'}. I’m Sage. Ask me anything about breaking the scroll — cravings, late nights, focus, whatever’s pulling at you.` }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const ref = useRef(null);
  const send = (text) => {
    const q = (text != null ? text : input).trim(); if (!q) return;
    setMsgs((m) => [...m, { who: 'you', text: q }]); setInput(''); setTyping(true);
    const ctx = { name: user.name, limitHours: user.limitHours, topApps: DISTRACTING, streakDays: 12 };
    sageAI(q, ctx).then((ans) => { setMsgs((m) => [...m, { who: 'sage', text: ans }]); setTyping(false); })
      .catch(() => { setMsgs((m) => [...m, { who: 'sage', text: mentorReply(q) }]); setTyping(false); });
  };
  const chips = ['Why can’t I stop scrolling?', 'I keep failing at night', 'Help me focus'];
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ paddingTop: TOP + 2, paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1, borderColor: T.line, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={onBack} hitSlop={12}><Text style={{ color: T.sub, fontSize: 24 }}>{'‹'}</Text></Pressable>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: T.bg2, borderWidth: 1.5, borderColor: T.gold, alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}>
          <SageMark size={20} />
        </View>
        <View style={{ marginLeft: 10 }}>
          <Text style={{ color: T.text, fontSize: 16, fontWeight: '700' }}>Sage</Text>
          <Text style={{ color: T.sub, fontSize: 11 }}>your mentor</Text>
        </View>
      </View>
      <ScrollView ref={ref} onContentSizeChange={() => ref.current && ref.current.scrollToEnd({ animated: true })} contentContainerStyle={{ padding: 18, paddingBottom: 8 }}>
        {msgs.map((m, i) => {
          const me = m.who === 'you';
          return (
            <View key={i} style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '84%', backgroundColor: me ? T.gold : T.card, borderWidth: me ? 0 : 1, borderColor: T.line, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 11, marginBottom: 10 }}>
              {me ? <Text style={{ color: '#1E201B', fontSize: 14.5, lineHeight: 21 }}>{m.text}</Text> : <Typewriter text={m.text} style={{ color: T.text, fontSize: 14.5, lineHeight: 21 }} />}
            </View>
          );
        })}
        {typing && (
          <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderWidth: 1, borderColor: T.line, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 }}>
            <TypingLeaf />
            <Text style={{ color: T.sub, fontSize: 13, marginLeft: 8 }}>Sage is thinking{'…'}</Text>
          </View>
        )}
        {msgs.length <= 1 && (
          <View style={{ marginTop: 6 }}>
            {chips.map((c) => (
              <Pressable key={c} onPress={() => send(c)} style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: T.gold, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8 }}>
                <Text style={{ color: T.gold, fontSize: 13.5 }}>{c}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderColor: T.line }}>
        <TextInput value={input} onChangeText={setInput} placeholder="Ask Sage…" placeholderTextColor={T.sub} keyboardAppearance={T.dark ? 'dark' : 'light'} onSubmitEditing={() => send()} returnKeyType="send"
          style={{ flex: 1, backgroundColor: T.card, borderWidth: 1, borderColor: T.line, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, color: T.text, fontSize: 15, marginRight: 10 }} />
        <Pressable onPress={() => send()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.gold, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#1E201B', fontSize: 19, fontWeight: '800' }}>{'↑'}</Text>
        </Pressable>
      </View>
      <Text style={{ color: T.sub, fontSize: 10, textAlign: 'center', paddingBottom: 8 }}>Prototype mentor {'·'} not a substitute for professional help</Text>
    </KeyboardAvoidingView>
  );
}
function RankTerrain() {
  const idx = RANKS.findIndex((r) => r[0] === rankNow[0]);
  const prog = rankNext ? (POINTS - rankNow[1]) / (rankNext[1] - rankNow[1]) : 1;
  const rowH = 76;
  const H = RANKS.length * rowH + 24;
  const W = SCREEN_W - 80; // page pad (22*2) + card pad (18*2)
  const nodeX = (i) => (i % 2 === 0 ? W * 0.26 : W * 0.74);
  const nodeY = (i) => H - 34 - i * rowH; // Seedling at the bottom, Sage at the top
  let d = `M ${nodeX(0)} ${nodeY(0)}`;
  for (let i = 1; i < RANKS.length; i++) {
    const x0 = nodeX(i - 1), y0 = nodeY(i - 1), x1 = nodeX(i), y1 = nodeY(i);
    const my = (y0 + y1) / 2;
    d += ` C ${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
  }
  let lx = nodeX(idx), ly = nodeY(idx);
  if (rankNext && idx < RANKS.length - 1) {
    lx = nodeX(idx) + (nodeX(idx + 1) - nodeX(idx)) * prog;
    ly = nodeY(idx) + (nodeY(idx + 1) - nodeY(idx)) * prog;
  }
  return (
    <View style={{ height: H, width: '100%' }}>
      <Svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Path d={d} fill="none" stroke={T.line} strokeWidth={6} strokeLinecap="round" strokeDasharray="2 11" />
      </Svg>
      {RANKS.map((r, i) => {
        const done = i <= idx; const cur = i === idx;
        const cx = nodeX(i), cy = nodeY(i);
        return (
          <View key={i} style={{ position: 'absolute', left: cx - 35, top: cy - 22, width: 70, alignItems: 'center' }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: done ? T.gold : T.bg2, borderWidth: 2, borderColor: done ? T.gold : T.line, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: done ? '#1E201B' : T.sub, fontSize: 14, fontWeight: '800' }}>{i + 1}</Text>
            </View>
            <Text style={{ color: cur ? T.gold : T.sub, fontSize: 10, marginTop: 4, fontWeight: cur ? '700' : '400', textAlign: 'center' }} numberOfLines={1}>{r[0]}</Text>
          </View>
        );
      })}
      <View style={{ position: 'absolute', left: lx - 16, top: ly - 46 }}>
        <FaceLeaf size={34} />
      </View>
    </View>
  );
}
function Achievements({ onBack }) {
  const prog = rankNext ? (POINTS - rankNow[1]) / (rankNext[1] - rankNow[1]) : 1;
  return (
    <Fade style={{ backgroundColor: T.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: TOP + 8, paddingHorizontal: 22, paddingBottom: 60 }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ marginBottom: 20 }}><Text style={{ color: T.sub, fontSize: 15 }}>{'‹'}  Back</Text></Pressable>
        <Card style={{ paddingVertical: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: T.sub, fontSize: 12, letterSpacing: 2, fontWeight: '700', flex: 1 }}>THE CLIMB</Text>
            <Text style={{ color: T.gold, fontSize: 15, fontWeight: '800' }}>{rankNow[0]}</Text>
          </View>
          <RankTerrain />
          <Text style={{ color: T.sub, fontSize: 12.5, textAlign: 'center', marginTop: 8 }}>{POINTS} SAGE points{rankNext ? ` · ${rankNext[1] - POINTS} to ${rankNext[0]}` : ' · top of the mountain'}</Text>
        </Card>
        <Text style={{ color: T.sub, fontSize: 12, letterSpacing: 2, fontWeight: '700', marginTop: 22, marginBottom: 10 }}>BADGES</Text>
        {BADGES.map((b, i) => {
          const done = b.now >= b.goal;
          return (
            <Card key={i} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', opacity: done ? 1 : 0.7 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: done ? T.gold + '22' : T.bg2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: done ? T.gold : T.line }}>
                <Text style={{ fontSize: 16 }}>{done ? '✓' : ''}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: T.text, fontSize: 15, fontWeight: '600' }}>{b.name}</Text>
                <Text style={{ color: T.sub, fontSize: 12.5, marginTop: 2 }}>{b.how}</Text>
              </View>
              {!done && <Text style={{ color: T.sub, fontSize: 12 }}>{b.now}/{b.goal}</Text>}
            </Card>
          );
        })}
      </ScrollView>
    </Fade>
  );
}
function WeeklyReport({ user, onClose }) {
  const [pg, setPg] = useState(0);
  const pages = [
    { k: 'THIS WEEK', big: fmtH(WEEK.reduce((a, b) => a + b, 0) / 7), t: 'your daily average', s: 'Down 18% from last week. The line is bending the right way.' },
    { k: 'BEST DAY', big: 'Saturday', t: `only ${fmtH(Math.min(...WEEK))}`, s: 'Weekends used to be your worst. Something clicked.' },
    { k: 'RECLAIMED', big: fmtH(Math.max(0, (user.avgHours || 4) - WEEK.reduce((a, b) => a + b, 0) / 7) * 7), t: 'given back this week', s: 'That’s a long dinner, a workout, and a phone call to someone who matters.' },
    { k: "WHAT'S DRIVING IT", drivers: true },
  ];
  const p = pages[pg];
  return (
    <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: TOP + 8, paddingHorizontal: 26 }}>
      <Pressable onPress={onClose} hitSlop={12} style={{ alignSelf: 'flex-end' }}><Text style={{ color: T.sub, fontSize: 22 }}>{'✕'}</Text></Pressable>
      <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 80 }}>
        <Text style={{ color: T.gold, letterSpacing: 3, fontSize: 12, fontWeight: '700', marginBottom: p.drivers ? 16 : 0 }}>{p.k}</Text>
        {p.drivers ? (
          <View>
            <Text style={{ color: T.text, fontSize: 21, fontWeight: '700', marginBottom: 14 }}>What moved your week</Text>
            {TRACKERS.map((t) => (
              <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: T.text, fontSize: 15, fontWeight: '600' }}>{t.label}</Text>
                  <Text style={{ color: T.sub, fontSize: 12.5, marginTop: 2 }} numberOfLines={1}>{t.desc}</Text>
                </View>
                <Text style={{ color: t.good ? T.good : T.bad, fontSize: 18, fontWeight: '800', marginLeft: 12 }}>{t.value}</Text>
              </View>
            ))}
          </View>
        ) : (
          <>
            <Text style={{ color: T.text, fontSize: 56, fontWeight: '800', marginVertical: 8 }}>{p.big}</Text>
            <Text style={{ color: T.text, fontSize: 19, fontWeight: '600' }}>{p.t}</Text>
            <Text style={{ color: T.sub, fontSize: 15.5, lineHeight: 24, marginTop: 14 }}>{p.s}</Text>
          </>
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
        {pages.map((_, i) => <View key={i} style={{ width: i === pg ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: i === pg ? T.gold : T.line }} />)}
      </View>
      <View style={{ marginBottom: 40 }}>
        <Btn label={pg < pages.length - 1 ? 'Next' : 'Done'} onPress={() => pg < pages.length - 1 ? setPg(pg + 1) : onClose()} />
      </View>
    </View>
  );
}

// ── Limit-hit flow ───────────────────────────────────────────────────────────
// ── Puck hardware bridge ─────────────────────────────────────────────────────
// Anton's native BLE module is the source of truth for attach/detach. When the
// BLE build lands (PUCK_NATIVE=true), it should call up({ puckConnected:false })
// on DETACH and up({ puckConnected:true }) on ATTACH — the whole breathing ritual
// below is driven off that single signal, so the hardware drops in with no UI change.
// Until then (demo), on-screen "demo" taps simulate removing / replacing the puck.
const PUCK_NATIVE = false;

// Illustration: a cupped palm receiving the puck — shown on the "place puck in hand" transition.
function PalmPuck({ size = 240 }) {
  return (
    <Svg width={size} height={size * 0.86} viewBox="0 0 240 206">
      {/* downward "place it down" motion cue */}
      <Circle cx={120} cy={8} r={2.4} fill={T.gold} opacity={0.4} />
      <Path d="M110,18 L120,29 L130,18" stroke={T.gold} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />
      {/* fingers */}
      <Path d="M78,98 L74,60" stroke="#E7CE92" strokeWidth={13} strokeLinecap="round" opacity={0.92} />
      <Path d="M104,96 L102,53" stroke="#E7CE92" strokeWidth={13} strokeLinecap="round" opacity={0.92} />
      <Path d="M136,96 L138,53" stroke="#E7CE92" strokeWidth={13} strokeLinecap="round" opacity={0.92} />
      <Path d="M162,98 L166,60" stroke="#E7CE92" strokeWidth={13} strokeLinecap="round" opacity={0.92} />
      {/* thumb */}
      <Path d="M52,122 L34,106" stroke="#E7CE92" strokeWidth={13} strokeLinecap="round" opacity={0.92} />
      {/* cupped palm */}
      <Path d="M40,112 C40,100 64,96 120,96 C176,96 200,100 200,112 C200,160 162,188 120,188 C78,188 40,160 40,112 Z" fill="#F5F2EA" fillOpacity={0.12} stroke="#E7CE92" strokeWidth={3} />
      {/* puck resting in the palm */}
      <Circle cx={120} cy={126} r={52} fill={T.gold} opacity={0.14} />
      <Circle cx={120} cy={126} r={39} fill="#1a1c14" stroke={T.gold} strokeWidth={4} />
      <Circle cx={120} cy={126} r={28} fill="none" stroke={T.gold} strokeWidth={2.5} opacity={0.6} />
    </Svg>
  );
}
// Stage 2+3 — the puck is OFF the phone and buzzing in your hand; the app breathes with it.
// It runs the full `secs` on its own. If the puck goes back on the phone early, that's a short breath.
function BreathAuto({ secs = 15, attached, onDone, onShort }) {
  const TOTAL = secs * 1000;
  const scale = useRef(new Animated.Value(0.62)).current;
  const heldRef = useRef(0);
  const doneRef = useRef(false);
  const attachedRef = useRef(attached);
  const [remain, setRemain] = useState(secs); // remaining seconds as a float → smooth countdown
  const [phase, setPhase] = useState('Breathe in');
  const player = useAudioPlayer(require('./assets/ambience.mp3'));
  useEffect(() => {
    try { player.loop = true; player.volume = 0.55; player.play(); } catch (e) {}
    return () => { try { player.pause(); } catch (e) {} };
  }, []);
  useEffect(() => { attachedRef.current = attached; }, [attached]); // latest puck state for the loop
  const breatheTo = (v) => Animated.timing(scale, { toValue: v, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
  useEffect(() => {
    let last = Date.now(), pt = 0, inhale = true, raf;
    breatheTo(1); hap('light'); // first inhale begins the moment the screen opens
    const loop = () => {
      const now = Date.now(), dt = now - last; last = now;
      if (!doneRef.current) {
        // puck went back on the phone before the breath finished → cut short
        if (attachedRef.current && heldRef.current > 400) { doneRef.current = true; onShort(Math.max(1, Math.round(heldRef.current / 1000))); return; }
        heldRef.current += dt; pt += dt;
        if (pt >= 4000) { pt = 0; inhale = !inhale; setPhase(inhale ? 'Breathe in' : 'Breathe out'); hap('light'); breatheTo(inhale ? 1 : 0.62); }
        setRemain(Math.max(0, (TOTAL - heldRef.current) / 1000)); // updated every frame for a smooth drain
        if (heldRef.current >= TOTAL) { doneRef.current = true; hap('success'); onDone(); return; }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={IMG.breathe} style={{ position: 'absolute', top: 0, left: 0, width: SCREEN_W, height: SCREEN_H }} resizeMode="cover" />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,12,8,0.5)' }} />
      <FloatingLeaves count={4} height={SCREEN_H} />
      <Text style={{ color: T.gold, letterSpacing: 2, fontSize: 12, fontWeight: '800', marginBottom: 6 }}>BREATHE WITH SAGE</Text>
      <Text style={{ color: T.text, fontSize: 15, marginBottom: 26, textAlign: 'center', paddingHorizontal: 44, lineHeight: 21 }}>Your puck is buzzing. Breathe in as it grows, out as it shrinks.</Text>
      <Ring pct={(secs - remain) / secs} size={252} stroke={6} color={T.gold} track={T.line}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <View style={{ width: 184, height: 184, borderRadius: 92, backgroundColor: T.gold + '2e', borderWidth: 2, borderColor: T.gold, alignItems: 'center', justifyContent: 'center' }}>
            <SageMark size={52} />
          </View>
        </Animated.View>
      </Ring>
      <Text style={{ color: T.text, fontSize: 22, fontWeight: '600', marginTop: 32 }}>{phase}</Text>
      <Text style={{ color: T.gold, fontSize: 34, fontWeight: '800', marginTop: 8, fontVariant: ['tabular-nums'] }}>{remain.toFixed(1)}<Text style={{ fontSize: 17, fontWeight: '700' }}>s</Text></Text>
      <Text style={{ color: T.sub, fontSize: 12, marginTop: 4 }}>pop SAGE back on when the ring fills</Text>
      {!PUCK_NATIVE && (
        <Pressable onPress={() => onShort(Math.max(1, Math.round(heldRef.current / 1000)))} style={{ position: 'absolute', bottom: 46, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 }}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>demo: put puck back early</Text>
        </Pressable>
      )}
    </View>
  );
}
// The Unlock — the post-limit ritual, through the puck.
// hit → prep (take puck off) → ready (tap to start) → breathe → choose/short → done.
function LimitFlow({ user, hits = 0, onExit, onExtend, up }) {
  const [step, setStep] = useState('hit');
  const [secs, setSecs] = useState(15);  // user picks their breath length
  const [cd, setCd] = useState(5);        // prep "get ready" countdown
  const [shortSecs, setShortSecs] = useState(0);
  const graceMin = hits === 0 ? 5 : 2;    // grace shrinks each time
  const xp = secs === 30 ? 5 : 3;         // 30s breath earns the bonus
  const streak0 = useRef(user.streak ?? 12).current; // the streak that just broke (captured before reset)
  const breakStreak = () => up && up({ streak: 0 }); // crossing the limit resets the streak
  const attached = user.puckConnected !== false;
  const detach = () => up && up({ puckConnected: false });  // native: Anton calls this on BLE detach
  const attachPuck = () => up && up({ puckConnected: true }); // native: Anton calls this on BLE attach
  const finish = () => { attachPuck(); onExit && onExit(); };   // leaving the ritual → puck back to normal
  const extend = () => { attachPuck(); onExtend && onExtend(); };
  useEffect(() => { hap('success'); }, []); // one firm buzz when the limit lands
  // prep: taking the puck OFF the phone is what advances us to the breath
  useEffect(() => { if (step === 'prep' && !attached) setStep('ready'); }, [step, attached]);
  // prep: 5s get-ready countdown
  useEffect(() => {
    if (step !== 'prep') return;
    setCd(5);
    const id = setInterval(() => setCd((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [step]);

  if (step === 'hit') {
    return (
      <Fade style={{ backgroundColor: T.bg }}>
        <Horizon height={220} opacity={0.5} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 }}>
          <SageMark size={64} />
          <Text style={{ color: T.gold, letterSpacing: 2, fontSize: 12, fontWeight: '800', marginTop: 22 }}>TIME'S UP</Text>
          <Text style={{ color: T.text, fontSize: 32, fontWeight: '800', textAlign: 'center', marginTop: 10 }}>Pick up SAGE.</Text>
          <Text style={{ color: T.sub, fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24 }}>You hit {fmtH(user.limitHours || 2)} today. A few seconds with your puck before the next scroll.</Text>
          <View style={{ position: 'absolute', bottom: 50, left: 34, right: 34 }}>
            <Text style={{ color: T.sub, fontSize: 12.5, textAlign: 'center', marginBottom: 10 }}>How long do you want to breathe?</Text>
            <View style={{ flexDirection: 'row', backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.line, padding: 4, marginBottom: 16 }}>
              {[15, 30].map((s) => (
                <Pressable key={s} onPress={() => { hap('light'); setSecs(s); }} style={{ flex: 1, paddingVertical: 9, borderRadius: 11, backgroundColor: secs === s ? T.gold : 'transparent', alignItems: 'center' }}>
                  <Text style={{ color: secs === s ? '#1E201B' : T.sub, fontSize: 15, fontWeight: '800' }}>{s} seconds</Text>
                  <Text style={{ color: s === 30 ? (secs === s ? '#1E201B' : T.gold) : 'transparent', fontSize: 11, fontWeight: '800', marginTop: 2 }}>★ +2 XP bonus</Text>
                </Pressable>
              ))}
            </View>
            <Btn label="I've got it — breathe" onPress={() => setStep('prep')} />
            <Pressable onPress={onExit} style={{ alignItems: 'center', marginTop: 16 }}><Text style={{ color: T.sub, fontSize: 14 }}>skip the ritual</Text></Pressable>
          </View>
        </View>
      </Fade>
    );
  }
  // PREP — a 5s get-ready while you lift SAGE off the phone; detaching advances us.
  if (step === 'prep') {
    return (
      <Fade style={{ backgroundColor: T.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 240, height: 206, alignItems: 'center', justifyContent: 'center' }}>
            <PalmPuck size={240} />
            <View style={{ position: 'absolute', top: 111, left: 105, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
              <SageMark size={30} />
            </View>
          </View>
          <Text style={{ color: '#F5F2EA', fontSize: 30, fontWeight: '900', textAlign: 'center', marginTop: 30, lineHeight: 37, letterSpacing: 0.2 }}>Place puck in hand to begin breathing exercise</Text>
          <Text style={{ color: T.sub, fontSize: 14, textAlign: 'center', marginTop: 16 }}>{cd > 0 ? `Lift SAGE off your phone · starting in ${cd}s` : 'Lift your puck off now to begin.'}</Text>
          {!PUCK_NATIVE && (
            <Pressable onPress={detach} style={{ position: 'absolute', bottom: 46, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>demo: remove puck</Text>
            </Pressable>
          )}
        </View>
      </Fade>
    );
  }
  // READY — puck is off; tap anywhere to actually start the breath.
  if (step === 'ready') {
    return (
      <Pressable onPress={() => { hap('light'); setStep('breathe'); }} style={{ flex: 1, backgroundColor: T.bg }}>
        <Fade style={{ backgroundColor: T.bg }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
            <SageMark size={58} />
            <Text style={{ color: T.gold, letterSpacing: 2, fontSize: 12, fontWeight: '800', marginTop: 22 }}>PUCK IN HAND</Text>
            <Text style={{ color: T.text, fontSize: 30, fontWeight: '800', textAlign: 'center', marginTop: 10 }}>Tap anywhere to begin.</Text>
            <Text style={{ color: T.sub, fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 }}>Hold your puck, settle in, and tap when you're ready for your {secs}-second breath.</Text>
          </View>
        </Fade>
      </Pressable>
    );
  }
  // BREATHE — runs the full time; early reattach → short breath.
  if (step === 'breathe') return <BreathAuto secs={secs} attached={attached} onDone={() => setStep('choose')} onShort={(s) => { setShortSecs(s); setStep('short'); }} />;
  // SHORT — the puck went back on before the breath was done.
  if (step === 'short') {
    return (
      <Fade style={{ backgroundColor: T.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: OVER + '22', borderWidth: 2, borderColor: OVER, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: OVER, fontSize: 38, fontWeight: '800' }}>{'!'}</Text>
          </View>
          <Text style={{ color: T.gold, letterSpacing: 2, fontSize: 12, fontWeight: '800', marginTop: 22 }}>SHORT BREATH</Text>
          <Text style={{ color: T.text, fontSize: 27, fontWeight: '800', textAlign: 'center', marginTop: 10 }}>You stopped early.</Text>
          <Text style={{ color: T.sub, fontSize: 15.5, textAlign: 'center', marginTop: 12, lineHeight: 23 }}>You breathed {shortSecs}s of {secs}s before putting SAGE back. No shame — but the full breath is where the reset happens.</Text>
          <View style={{ position: 'absolute', bottom: 50, left: 34, right: 34 }}>
            <Btn label="Try the full breath" onPress={() => setStep('prep')} />
            <Pressable onPress={() => setStep('choose')} style={{ alignItems: 'center', marginTop: 16 }}><Text style={{ color: T.sub, fontSize: 14 }}>that's enough for now</Text></Pressable>
          </View>
        </View>
      </Fade>
    );
  }
  if (step === 'choose') {
    return (
      <Fade style={{ backgroundColor: T.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
          <SageMark size={54} />
          <Text style={{ color: T.text, fontSize: 27, fontWeight: '800', textAlign: 'center', marginTop: 22 }}>You went over your limit.</Text>
          <Text style={{ color: T.sub, fontSize: 15.5, textAlign: 'center', marginTop: 12, lineHeight: 23 }}>The breath still counts — but today's streak is done. What now?</Text>
          <View style={{ position: 'absolute', bottom: 50, left: 30, right: 30 }}>
            <Pressable onPress={() => { breakStreak(); setStep('done'); }} style={({ pressed }) => [{ backgroundColor: T.gold, borderRadius: 16, padding: 18, opacity: pressed ? 0.9 : 1 }]}>
              <Text style={{ color: '#1E201B', fontSize: 17, fontWeight: '800', textAlign: 'center' }}>I'm done for now</Text>
              <Text style={{ color: '#1E201B', opacity: 0.72, fontSize: 12.5, textAlign: 'center', marginTop: 3 }}>+{xp} points for the breath{secs === 30 ? ' (incl. +2 bonus)' : ''} · streak resets to 0</Text>
            </Pressable>
            <Pressable onPress={() => { breakStreak(); extend(); }} style={({ pressed }) => [{ backgroundColor: T.card, borderWidth: 1, borderColor: T.line, borderRadius: 16, padding: 16, marginTop: 12, opacity: pressed ? 0.9 : 1 }]}>
              <Text style={{ color: T.text, fontSize: 15.5, fontWeight: '700', textAlign: 'center' }}>{graceMin} more minutes</Text>
              <Text style={{ color: T.sub, fontSize: 12, textAlign: 'center', marginTop: 3 }}>{hits === 0 ? 'your first grace today — it shrinks to 2 min next time' : 'last grace — cross this and your top 3 apps lock till midnight'}</Text>
            </Pressable>
          </View>
        </View>
      </Fade>
    );
  }
  // done — honest: the limit was crossed, so the streak resets
  return (
    <Fade style={{ backgroundColor: T.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: OVER + '22', borderWidth: 2, borderColor: OVER, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: OVER, fontSize: 40, fontWeight: '800' }}>{'0'}</Text>
        </View>
        <Text style={{ color: T.text, fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 24 }}>Streak reset.</Text>
        <Text style={{ color: T.sub, fontSize: 15.5, textAlign: 'center', marginTop: 12, lineHeight: 23 }}>You crossed your limit today, so your {streak0}-day streak is back to 0. The breath still built the muscle — stay under tomorrow and it's Day 1 again.</Text>
        <View style={{ position: 'absolute', bottom: 50, left: 34, right: 34 }}>
          <View style={{ backgroundColor: OVER + '18', borderWidth: 1, borderColor: OVER + '66', borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <Text style={{ color: OVER, fontSize: 12.5, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 }}>{'⚠'} NO FREE PASSES</Text>
            <Text style={{ color: T.text, fontSize: 13, textAlign: 'center', marginTop: 5, lineHeight: 19 }}>Going over your limit always resets the streak. That's what makes staying under it mean something.</Text>
          </View>
          <Btn label="Back home" onPress={finish} />
        </View>
      </View>
    </Fade>
  );
}

// ── Share stats (Instagram-story mock) ───────────────────────────────────────
function FloatingPillar({ id, delay = 0, lift = 0 }) {
  const p = PILLARS[id];
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 1400, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);
  const ty = a.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  return (
    <Animated.View style={{ alignItems: 'center', marginBottom: lift, transform: [{ translateY: ty }] }}>
      <Ring pct={p.score / 100} size={60} stroke={5} color={p.accent} track="rgba(255,255,255,0.22)">
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{p.score}</Text>
      </Ring>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, marginTop: 5 }}>{p.label}</Text>
    </Animated.View>
  );
}
function ShareCard({ user, onClose }) {
  const [shared, setShared] = useState(false);
  const lvl = RANKS.findIndex((r) => r[0] === rankNow[0]) + 1;
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      <Pressable onPress={onClose} hitSlop={12} style={{ position: 'absolute', top: TOP, right: 24 }}><Text style={{ color: '#fff', fontSize: 24 }}>{'✕'}</Text></Pressable>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 14 }}>Preview — how it'd look on your story</Text>
      <View style={{ width: SCREEN_W * 0.78, aspectRatio: 0.6, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
        <Image source={IMG.forest} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="cover" />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12,14,10,0.6)' }} />
        <View style={{ flex: 1, padding: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ color: '#F5F2EA', fontSize: 11, fontWeight: '700' }}>{rankNow[0]}</Text>
            </View>
            <View style={{ backgroundColor: T.gold, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ color: '#1E201B', fontSize: 11, fontWeight: '800' }}>LVL {lvl}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <Wordmark size={40} color="#F5F2EA" />
            <Text style={{ color: T.goldSoft, fontSize: 12, fontStyle: 'italic', marginTop: 6, textAlign: 'center' }}>the device that proves your time's true value</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: T.gold, fontSize: 66, fontWeight: '800' }}>12</Text>
            <Text style={{ color: '#F5F2EA', fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: -2, paddingHorizontal: 12 }}>day streak staying under my screen-time limit</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginBottom: 4 }}>
            <FloatingPillar id="focus" delay={0} lift={0} />
            <FloatingPillar id="sleep" delay={300} lift={20} />
            <FloatingPillar id="balance" delay={600} lift={0} />
          </View>
        </View>
      </View>
      <View style={{ marginTop: 22, alignSelf: 'stretch', paddingHorizontal: 24 }}>
        <Btn label={shared ? 'Shared ✓' : 'Share to my story'} onPress={async () => { try { await Share.share({ message: "I'm staying under my screen-time limit with SAGE — a mentor on my phone, not a cop. Take your time back 🌱 sageband.co" }); setShared(true); } catch (e) {} }} />
      </View>
    </View>
  );
}

// ── Milestone celebration ────────────────────────────────────────────────────
function Celebration({ title, sub, onDone }) {
  const pop = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    hap('success');
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(spin, { toValue: 1, duration: 480, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(spin, { toValue: -1, duration: 480, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, []);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const rot = spin.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });
  return (
    <Pressable onPress={onDone} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12,14,10,0.88)', alignItems: 'center', justifyContent: 'center' }}>
      <FloatingLeaves count={16} height={SCREEN_H} />
      <Animated.View style={{ transform: [{ scale }, { rotate: rot }] }}>
        <FaceLeaf size={124} />
      </Animated.View>
      <Animated.Text style={{ opacity: pop, color: T.gold, fontSize: 34, fontWeight: '800', marginTop: 26, textAlign: 'center', textShadowColor: T.gold + '66', textShadowRadius: 16 }}>{title}</Animated.Text>
      <Animated.Text style={{ opacity: pop, color: '#F5F2EA', fontSize: 15.5, marginTop: 10, textAlign: 'center', paddingHorizontal: 44, lineHeight: 22 }}>{sub}</Animated.Text>
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, position: 'absolute', bottom: 56 }}>tap to continue</Text>
    </Pressable>
  );
}

// ── Tab bar ──────────────────────────────────────────────────────────────────
// A leaf with a mood — happy (smile) or dying (frown + a tear).
function MoodLeaf({ size = 28, color = '#49C277', mood = 'happy' }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110">
      <Path d="M50 6 C20 30 18 72 50 102 C82 72 80 30 50 6 Z" fill={color} />
      <Path d="M50 6 C20 30 18 72 50 102 C82 72 80 30 50 6 Z" fill="none" stroke={mood === 'happy' ? T.gold : '#5a4a30'} strokeWidth="3" />
      <Circle cx="41" cy="52" r="4.5" fill="#12211A" />
      <Circle cx="59" cy="52" r="4.5" fill="#12211A" />
      {mood === 'happy'
        ? <Path d="M41 66 Q50 73 59 66" stroke="#12211A" strokeWidth="3" fill="none" strokeLinecap="round" />
        : <Path d="M41 70 Q50 63 59 70" stroke="#12211A" strokeWidth="3" fill="none" strokeLinecap="round" />}
      {mood !== 'happy' && <Path d="M41 57 Q39 65 42 69" stroke="#6FA8D6" strokeWidth="3" fill="none" strokeLinecap="round" />}
    </Svg>
  );
}
// SAGE-AGE tab icon: lives glowing green ~30s, then wilts brown, droops and sinks into its grave
// ~9s, then the puck springs it back to life. Forever.
function LeafLifeIcon({ size = 26 }) {
  const life = useRef(new Animated.Value(1)).current; // 1 = alive & glowing, 0 = dead in the grave
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(30000),
      Animated.timing(life, { toValue: 0, duration: 1100, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.delay(9000),
      Animated.spring(life, { toValue: 1, friction: 4, tension: 70, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const ty = life.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const sc = life.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  const rot = life.interpolate({ inputRange: [0, 1], outputRange: ['16deg', '0deg'] });
  const dead = life.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  return (
    <View style={{ width: size + 10, height: size * 1.25, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ position: 'absolute', bottom: 1, width: size * 0.72, height: 2, borderRadius: 1, backgroundColor: T.line }} />
      <Animated.View style={{ transform: [{ translateY: ty }, { scale: sc }, { rotate: rot }] }}>
        <Animated.View style={{ opacity: life, shadowColor: '#4fd17a', shadowOpacity: 0.95, shadowRadius: 9, shadowOffset: { width: 0, height: 0 } }}>
          <MoodLeaf size={size} color="#49C277" mood="happy" />
        </Animated.View>
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, opacity: dead }}>
          <MoodLeaf size={size} color="#7a5a34" mood="dying" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
function TabBar({ tab, setTab }) {
  const tabs = [['today', 'Today'], ['trends', 'Trends'], ['sageage', 'SAGE-AGE'], ['circle', 'Circle'], ['settings', 'Settings']];
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 86, flexDirection: 'row', backgroundColor: T.bg2, borderTopWidth: 1, borderColor: T.line, paddingTop: 10 }}>
      {tabs.map(([k, label]) => {
        const on = tab === k;
        const isLife = k === 'sageage';
        return (
          <Pressable key={k} onPress={() => { hap('light'); setTab(k); }} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ height: 30, justifyContent: 'center' }}>
              {isLife ? <LeafLifeIcon size={26} /> : (on ? <SageMark size={26} color={T.gold} /> : <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: T.sub }} />)}
            </View>
            <Text style={{ color: on ? T.gold : (isLife ? '#49C277' : T.sub), fontSize: isLife ? 9.5 : 11.5, fontWeight: on ? '800' : (isLife ? '700' : '500'), marginTop: 3, letterSpacing: isLife ? 0.3 : 0 }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
// Real sign-in / sign-up — shown on launch when BACKEND_READY is true.
function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const valid = email.includes('@') && pw.length >= 6 && (mode === 'signin' || name.trim().length > 0);
  const go = async () => {
    if (!valid || busy) return;
    setErr(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'signup') {
        await authSignUp(email.trim(), pw, name.trim());
        if (SESSION && SESSION.access_token) { hap('success'); onAuthed(); }
        else { setInfo('Check your email to confirm, then sign in.'); setMode('signin'); }
      } else {
        await authSignIn(email.trim(), pw); hap('success'); onAuthed();
      }
    } catch (e) { setErr((e && e.message) || 'Something went wrong'); }
    setBusy(false);
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 60 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <Wordmark size={44} />
          <Text style={{ color: T.sub, fontSize: 14, marginTop: 12 }}>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</Text>
        </View>
        {mode === 'signup' && (
          <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={T.sub} keyboardAppearance={T.dark ? 'dark' : 'light'}
            style={{ backgroundColor: T.card, borderWidth: 1, borderColor: T.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: T.text, fontSize: 16, marginBottom: 12 }} />
        )}
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={T.sub} autoCapitalize="none" keyboardType="email-address" keyboardAppearance={T.dark ? 'dark' : 'light'}
          style={{ backgroundColor: T.card, borderWidth: 1, borderColor: T.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: T.text, fontSize: 16, marginBottom: 12 }} />
        <TextInput value={pw} onChangeText={setPw} placeholder="Password (6+ characters)" placeholderTextColor={T.sub} secureTextEntry autoCapitalize="none" keyboardAppearance={T.dark ? 'dark' : 'light'}
          style={{ backgroundColor: T.card, borderWidth: 1, borderColor: T.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: T.text, fontSize: 16, marginBottom: 16 }} />
        {err ? <Text style={{ color: T.bad, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{err}</Text> : null}
        {info ? <Text style={{ color: T.good, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{info}</Text> : null}
        <Btn label={busy ? 'Just a moment…' : (mode === 'signup' ? 'Create account' : 'Sign in')} disabled={!valid || busy} onPress={go} />
        <Pressable onPress={() => { setErr(''); setInfo(''); setMode(mode === 'signup' ? 'signin' : 'signup'); }} style={{ alignItems: 'center', marginTop: 18, padding: 8 }}>
          <Text style={{ color: T.sub, fontSize: 13.5 }}>{mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
// Lock mode — top-3 abused apps locked till midnight; a 10-word reflection unlocks them.
function LockMode({ onUnlock }) {
  const [txt, setTxt] = useState('');
  const words = txt.trim().split(/\s+/).filter(Boolean).length;
  const ok = words >= 10;
  const apps = [...APP_USAGE].filter((a) => !a.necessity).sort((a, b) => b.d - a.d).slice(0, 3);
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 50 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: OVER + '1F', borderWidth: 2, borderColor: OVER, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 32 }}>🔒</Text></View>
          <Text style={{ color: OVER, letterSpacing: 2, fontSize: 12, fontWeight: '800', marginTop: 18 }}>APPS LOCKED UNTIL MIDNIGHT</Text>
          <Text style={{ color: T.text, fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 10 }}>You crossed your last grace.</Text>
          <Text style={{ color: T.sub, fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 22, paddingHorizontal: 10 }}>Your three heaviest apps are locked. Write a short, honest reflection and SAGE will unlock them.</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: 22 }}>
            {apps.map((a) => (
              <View key={a.name} style={{ alignItems: 'center' }}>
                <View style={{ opacity: 0.4 }}><AppIcon name={a.name} size={52} /></View>
                <Text style={{ color: OVER, fontSize: 10, fontWeight: '800', marginTop: 5 }}>LOCKED</Text>
              </View>
            ))}
          </View>
          <Text style={{ color: T.text, fontSize: 13, fontWeight: '700', alignSelf: 'stretch', marginTop: 26, marginBottom: 8 }}>What will you change? (10 words minimum)</Text>
          <TextInput value={txt} onChangeText={setTxt} multiline placeholder="e.g. I will reduce my screen time on TikTok, since it is the app taking up the majority of my day." placeholderTextColor={T.sub} keyboardAppearance={T.dark ? 'dark' : 'light'}
            style={{ alignSelf: 'stretch', minHeight: 110, backgroundColor: T.card, borderWidth: 1.5, borderColor: ok ? T.good : T.line, borderRadius: 16, padding: 15, color: T.text, fontSize: 15, lineHeight: 21, textAlignVertical: 'top' }} />
          <Text style={{ color: ok ? T.good : T.sub, fontSize: 12.5, alignSelf: 'flex-end', marginTop: 8, fontWeight: '700' }}>{words} / 10 words</Text>
          <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
            <Btn label={ok ? 'Unlock my apps' : `${10 - words} more words to unlock`} disabled={!ok} onPress={() => { hap('success'); onUnlock(); }} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
// End-of-onboarding setup guide — a simple walkthrough + what each buzz means.
function ObGuide({ onDone }) {
  const steps = [
    ['📲', 'Snap on your puck', "Click SAGE onto the back of your phone. The gold “S” glows when it's connected."],
    ['🔔', 'One firm buzz = your limit', "Cross your daily line and the puck buzzes once — your cue to pick it up."],
    ['🤍', 'A gentle heartbeat = breathe', 'Hold the puck and feel it pulse. Breathe with it for 15–30 seconds. That’s The Unlock.'],
    ['🌿', 'Then you choose', 'Done for now, or a short grace. Grace shrinks each time — 5 min, then 2, then your top apps lock.'],
    ['🔋', 'Keep it charged', "A charge lasts days. If it ever disconnects, the app tells you right away."],
  ];
  return (
    <Fade style={{ backgroundColor: T.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: TOP + 10, paddingHorizontal: 24, paddingBottom: 40 }}>
        <SageMark size={44} />
        <Text style={{ color: T.gold, letterSpacing: 2, fontSize: 12, fontWeight: '800', marginTop: 16 }}>YOU'RE ALL SET</Text>
        <Text style={{ color: T.text, fontSize: 28, fontWeight: '800', marginTop: 6 }}>How SAGE works</Text>
        <Text style={{ color: T.sub, fontSize: 14.5, marginTop: 6, marginBottom: 18, lineHeight: 21 }}>A 30-second walkthrough so nothing surprises you.</Text>
        {steps.map(([ic, t, d], i) => (
          <Card key={i} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.bg2, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}><Text style={{ fontSize: 20 }}>{ic}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: T.text, fontSize: 16.5, fontWeight: '800' }}>{t}</Text>
              <Text style={{ color: T.sub, fontSize: 13.5, lineHeight: 19, marginTop: 3 }}>{d}</Text>
            </View>
          </Card>
        ))}
        <View style={{ marginTop: 10 }}><Btn label="Enter SAGE" onPress={onDone} /></View>
      </ScrollView>
    </Fade>
  );
}
// Personalized insights the AI mentor surfaces from each user's own patterns.
const INSIGHTS = [
  ['🌙', "You scroll most between 10:00 and 11:30 PM — your quietest hours are your heaviest."],
  ['📅', "Thursdays are your heaviest day at ~3h 29m. Fridays aren't far behind."],
  ['📈', "Instagram drives 38% of your week — tightening this one moves the needle most."],
];
function SageNotes() {
  return (
    <Card style={{ marginTop: 14, paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <SageMark size={15} />
        <Text style={{ color: T.sub, fontSize: 11, letterSpacing: 2, fontWeight: '800', marginLeft: 8 }}>SAGE NOTICED</Text>
      </View>
      {INSIGHTS.map(([ic, t], i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: i === 0 ? 0 : 8 }}>
          <Text style={{ fontSize: 13, marginRight: 9 }}>{ic}</Text>
          <Text style={{ color: T.text, fontSize: 12.5, lineHeight: 17, flex: 1 }}>{t}</Text>
        </View>
      ))}
    </Card>
  );
}
// A radar-style pulse ring that expands and fades forever — the living halo around the SAGE-AGE number.
function PulseHalo({ size, color, delay }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.timing(a, { toValue: 1, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    const t = setTimeout(() => anim.start(), delay || 0);
    return () => { clearTimeout(t); anim.stop(); };
  }, []);
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.75] });
  const opacity = a.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 0.45, 0] });
  return <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color, transform: [{ scale }], opacity }} />;
}
// SAGE-AGE — the years you're on pace to save, with a living pulse. Built for sharing.
function LifeSaviour({ user, onClose, asTab }) {
  const DAYS_REQ = 30;
  const [shared, setShared] = useState(false);
  // Local estimate (used offline or until the backend answers).
  const before = user.avgHours || 5;
  const cut = Math.max(0.4, before - 1.6);
  const remaining = Math.max(10, 82 - (user.age || 24));
  const localYears = Math.max(0.5, Math.round(cut * remaining / 16 * 10) / 10);
  // Live result from Supabase (recomputed from real usage; refreshed every Sunday).
  const [live, setLive] = useState(null);
  useEffect(() => { let on = true; sageAge().then((r) => { if (on && r) setLive(r); }); return () => { on = false; }; }, []);
  const daysUsed = live ? live.days_tracked : 34; // demo falls back past the threshold so the reveal shows
  const ready = live ? !!live.ready : daysUsed >= DAYS_REQ;
  const years = (live && live.years_saved != null) ? live.years_saved : localYears;
  return (
    <View style={{ flex: 1, backgroundColor: '#0f120c', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Image source={IMG.forest} style={{ position: 'absolute', top: 0, left: 0, width: SCREEN_W, height: SCREEN_H }} resizeMode="cover" />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12,14,10,0.8)' }} />
      <FloatingLeaves count={7} height={SCREEN_H} />
      {!asTab && <Pressable onPress={onClose} hitSlop={14} style={{ position: 'absolute', top: TOP, right: 24, zIndex: 5 }}><Text style={{ color: '#fff', fontSize: 24 }}>{'✕'}</Text></Pressable>}
      <Text style={{ color: T.gold, letterSpacing: 4, fontSize: 13, fontWeight: '800', position: 'absolute', top: TOP + 6 }}>SAGE-AGE</Text>

      {!ready ? (
        <View style={{ alignItems: 'center' }}>
          <Ring pct={daysUsed / DAYS_REQ} size={190} stroke={10} color={T.gold} track="rgba(255,255,255,0.14)">
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '800' }}>{daysUsed}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>of {DAYS_REQ} days</Text>
          </Ring>
          <Text style={{ color: '#F5F2EA', fontSize: 23, fontWeight: '800', textAlign: 'center', marginTop: 26 }}>Almost there.</Text>
          <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 22 }}>{DAYS_REQ - daysUsed} more days of real habits and SAGE can show the years you're winning back.</Text>
        </View>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#F5F2EA', fontSize: 22, fontWeight: '600', textAlign: 'center' }}>You're on track to save</Text>
          <View style={{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginVertical: 18 }}>
            <PulseHalo size={224} color={T.gold} delay={0} />
            <PulseHalo size={224} color={T.gold} delay={730} />
            <PulseHalo size={224} color={T.gold} delay={1460} />
            <View style={{ width: 210, height: 210, borderRadius: 105, borderWidth: 2.5, borderColor: T.gold, backgroundColor: 'rgba(199,162,78,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: T.gold, fontSize: 90, fontWeight: '800', lineHeight: 94, textShadowColor: 'rgba(199,162,78,0.55)', textShadowRadius: 22 }}>{years}</Text>
              <Text style={{ color: '#F5F2EA', fontSize: 16, fontWeight: '700', marginTop: 2, letterSpacing: 1 }}>YEARS</Text>
            </View>
          </View>
          <Text style={{ color: '#F5F2EA', fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 29, maxWidth: 320 }}>of your life, back from the{'\n'}soul-sucking device.</Text>
          {live && live.headline ? <Text style={{ color: T.gold, fontSize: 14.5, fontStyle: 'italic', textAlign: 'center', marginTop: 16, maxWidth: 300, lineHeight: 20 }}>{'“' + live.headline + '”'}</Text> : null}
          <Pressable onPress={async () => { hap('success'); try { await Share.share({ message: `I'm on track to save ${years} years of my life from the soul-sucking device, with SAGE 🌱 How many are you losing? sageband.co` }); } catch (e) {} setShared(true); setTimeout(() => setShared(false), 2200); }} style={({ pressed }) => [{ marginTop: 34, backgroundColor: T.gold, borderRadius: 26, paddingVertical: 14, paddingHorizontal: 34, flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.9 : 1 }]}>
            <Text style={{ color: '#1E201B', fontSize: 16, fontWeight: '800' }}>{shared ? 'Saved to share ✓' : 'Share my progress'}</Text>
            {!shared && <Text style={{ color: '#1E201B', fontSize: 17, marginLeft: 8 }}>{'↗'}</Text>}
          </Pressable>
        </View>
      )}
    </View>
  );
}
const FRESH = { name: '', age: null, avgHours: null, limitHours: 2, perm: false, puck: 'Sage', buzz: 'soft', workApps: [], struggleApps: [], redLight: false, notif: true, paid: true, puckConnected: true, streak: 12 };

export default function App() {
  const [phase, setPhase] = useState('splash');   // splash | onboard | main
  const [obStep, setObStep] = useState('welcome');
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState('today');
  const [themeKey, setThemeKey] = useState('sage');
  const [overlay, setOverlay] = useState(null);    // {type:'tracker',data} | 'achieve' | 'report' | 'limit'
  const [celebrate, setCelebrate] = useState(null); // {title, sub} or null
  const [user, setUser] = useState({ ...FRESH });
  const [extendLeft, setExtendLeft] = useState(null); // display-seconds; demo runs ~1s per shown minute
  const [hits, setHits] = useState(0);     // limit hits today → grace shrinks: 5m, then 2m, then lock
  const [locked, setLocked] = useState(false); // top-3 apps locked until midnight
  const hitsRef = useRef(0); hitsRef.current = hits;
  const up = (patch) => setUser((u) => ({ ...u, ...patch }));
  const setTheme = (k) => { T = THEMES[k]; setThemeKey(k); };
  // grace shrinks each time: first hit → 5 min, second → 2 min
  const onExtend = () => { setOverlay(null); setExtendLeft(hitsRef.current === 0 ? 300 : 120); setHits((h) => h + 1); };
  const triggerLimit = () => { if (hitsRef.current >= 2) setLocked(true); else setOverlay('limit'); };
  const onboardedRef = useRef(false);
  const hydrated = useRef(false);

  // load saved state once on launch
  useEffect(() => {
    (async () => {
      try {
        const raw = await storageGet('sage_state');
        if (raw) {
          const s = JSON.parse(raw);
          if (s.user) setUser({ ...FRESH, ...s.user });
          if (s.themeKey && THEMES[s.themeKey]) { T = THEMES[s.themeKey]; setThemeKey(s.themeKey); }
          if (s.onboarded) { setOnboarded(true); onboardedRef.current = true; }
        }
      } catch (e) {}
      if (BACKEND_READY) { try { const sess = await storageGet('sage_session'); if (sess) SESSION = JSON.parse(sess); } catch (e) {} }
      hydrated.current = true;
    })();
  }, []);

  // persist whenever something meaningful changes
  useEffect(() => {
    if (!hydrated.current) return;
    storageSet('sage_state', JSON.stringify({ user, onboarded, themeKey }));
  }, [user, onboarded, themeKey]);

  useEffect(() => {
    if (extendLeft == null) return;
    const iv = setInterval(() => {
      setExtendLeft((s) => {
        if (s == null || s <= 60) {
          // grace just ran out → escalate: breathe again, or lock after the 2nd grace
          setTimeout(() => { if (hitsRef.current >= 2) setLocked(true); else setOverlay('limit'); }, 0);
          return null;
        }
        return s - 60;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [extendLeft != null]);

  const restart = () => { storageRemove('sage_state'); onboardedRef.current = false; setUser({ ...FRESH }); setExtendLeft(null); setHits(0); setLocked(false); setOnboarded(false); setObStep('welcome'); setTab('today'); setOverlay(null); setPhase(BACKEND_READY ? 'auth' : 'onboard'); if (BACKEND_READY) authSignOut(); };

  // splash
  if (phase === 'splash') {
    return (<View style={{ flex: 1, backgroundColor: T.bg }}><StatusBar style={T.dark ? 'light' : 'dark'} /><Splash onDone={() => setPhase(BACKEND_READY && !(SESSION && SESSION.access_token) ? 'auth' : (onboardedRef.current ? 'main' : 'onboard'))} /></View>);
  }

  // auth (real sign-in, only when the backend is configured)
  if (phase === 'auth') {
    return (<View style={{ flex: 1, backgroundColor: T.bg }} key={themeKey}><StatusBar style={T.dark ? 'light' : 'dark'} /><AuthScreen onAuthed={() => setPhase(onboardedRef.current ? 'main' : 'onboard')} /></View>);
  }

  // onboarding
  if (phase === 'onboard') {
    const finish = () => { setOnboarded(true); onboardedRef.current = true; setPhase('main'); setCelebrate({ title: "You're in!", sub: 'Your climb begins today — day one of the rest of your life.' }); };
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: T.bg }}>
        <StatusBar style={T.dark ? 'light' : 'dark'} />
        {obStep === 'welcome' && <ObWelcome onNext={() => setObStep('name')} />}
        {obStep === 'name' && <ObName key="name" user={user} up={up} onBack={() => setObStep('welcome')} onNext={() => setObStep('age')} />}
        {obStep === 'age' && <ObAge key="age" user={user} up={up} onBack={() => setObStep('name')} onNext={() => setObStep('hours')} />}
        {obStep === 'hours' && <ObHours key="hours" user={user} up={up} onBack={() => setObStep('age')} onNext={() => setObStep('reveal')} />}
        {obStep === 'reveal' && <ObReveal key="reveal" user={user} onBack={() => setObStep('hours')} onNext={() => setObStep('limit')} />}
        {obStep === 'limit' && <ObLimit key="limit" user={user} up={up} onBack={() => setObStep('reveal')} onNext={() => setObStep('permission')} />}
        {obStep === 'permission' && <ObPermission key="perm" onBack={() => setObStep('limit')} onNext={() => setObStep('apps')} />}
        {obStep === 'apps' && <ObApps key="apps" user={user} up={up} onBack={() => setObStep('permission')} onNext={() => setObStep('connect')} />}
        {obStep === 'connect' && <ObConnect key="connect" user={user} up={up} onBack={() => setObStep('apps')} onDone={() => setObStep('guide')} />}
        {obStep === 'guide' && <ObGuide key="guide" onDone={finish} />}
      </KeyboardAvoidingView>
    );
  }

  // lock mode — top-3 apps locked until midnight; a 10-word reflection unlocks them
  if (locked) return (<View style={{ flex: 1, backgroundColor: T.bg }} key={themeKey}><StatusBar style={T.dark ? 'light' : 'dark'} /><LockMode onUnlock={() => { setLocked(false); setHits(0); }} /></View>);

  // overlays (full-screen, above main)
  if (overlay === 'limit') return (<View style={{ flex: 1, backgroundColor: T.bg }} key={themeKey}><StatusBar style={T.dark ? 'light' : 'dark'} /><LimitFlow user={user} hits={hits} onExit={() => setOverlay(null)} onExtend={onExtend} up={up} /></View>);
  if (overlay === 'report') return (<View style={{ flex: 1 }} key={themeKey}><StatusBar style={T.dark ? 'light' : 'dark'} /><WeeklyReport user={user} onClose={() => setOverlay(null)} /></View>);
  if (overlay === 'achieve') return (<View style={{ flex: 1, backgroundColor: T.bg }} key={themeKey}><StatusBar style={T.dark ? 'light' : 'dark'} /><Achievements onBack={() => setOverlay(null)} /></View>);
  if (overlay && overlay.type === 'tracker') return (<View style={{ flex: 1, backgroundColor: T.bg }} key={themeKey}><StatusBar style={T.dark ? 'light' : 'dark'} /><TrackerDetail t={overlay.data} onBack={() => setOverlay(null)} /></View>);
  if (overlay === 'apps') return (<View style={{ flex: 1, backgroundColor: T.bg }} key={themeKey}><StatusBar style={T.dark ? 'light' : 'dark'} /><AppsManager user={user} up={up} onBack={() => setOverlay(null)} /></View>);
  if (overlay === 'mentor') return (<View style={{ flex: 1, backgroundColor: T.bg }} key={themeKey}><StatusBar style={T.dark ? 'light' : 'dark'} /><Mentor user={user} onBack={() => setOverlay(null)} /></View>);
  if (overlay && overlay.type === 'pillar') return (<View style={{ flex: 1, backgroundColor: T.bg }} key={themeKey}><StatusBar style={T.dark ? 'light' : 'dark'} /><PillarDetail id={overlay.data} onBack={() => setOverlay(null)} /></View>);
  if (overlay === 'share') return (<View style={{ flex: 1, backgroundColor: T.bg }} key={themeKey}><StatusBar style={T.dark ? 'light' : 'dark'} /><ShareCard user={user} onClose={() => setOverlay(null)} /></View>);
  if (overlay === 'life') return (<View style={{ flex: 1, backgroundColor: T.bg }} key={themeKey}><StatusBar style="light" /><LifeSaviour user={user} onClose={() => setOverlay(null)} /></View>);

  // main
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }} key={themeKey}>
      <StatusBar style={T.dark ? 'light' : 'dark'} />
      <Fade key={tab} style={{ flex: 1 }}>
      {tab === 'today' && <Home user={user} up={up} hits={hits} onLimit={triggerLimit} onMentor={() => setOverlay('mentor')} onPillar={(id) => setOverlay({ type: 'pillar', data: id })} onAchieve={() => setOverlay('achieve')} onRestart={restart} extendLeft={extendLeft} onShare={() => setOverlay('share')} onLife={() => setOverlay('life')} onCelebrate={() => setCelebrate((user.streak ?? 12) > 0 ? { title: `Day ${user.streak ?? 12}!`, sub: 'Another day under your limit. The leaf is proud of you.' } : { title: 'Day 0', sub: 'Streak reset — stay under your limit tomorrow to start again.' })} />}
      {tab === 'trends' && <Trends user={user} onReport={() => setOverlay('report')} onTracker={(t) => setOverlay({ type: 'tracker', data: t })} />}
      {tab === 'sageage' && <LifeSaviour user={user} asTab />}
      {tab === 'circle' && <CircleTab user={user} />}
      {tab === 'settings' && <Settings user={user} up={up} themeKey={themeKey} setTheme={setTheme} onRestart={restart} onApps={() => setOverlay('apps')} />}
      </Fade>
      <TabBar tab={tab} setTab={setTab} />
      {user.redLight && <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,72,0,0.20)' }} />}
      {celebrate && <Celebration title={celebrate.title} sub={celebrate.sub} onDone={() => setCelebrate(null)} />}
    </View>
  );
}
