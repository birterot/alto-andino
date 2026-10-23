// @ts-nocheck
// Alto Andino: sends the notifications (web push) to the phones that turned them on in Settings.
// Called by the app with the signed-in person's login, so it only sees what that person may see:
//   { action: "key" }                              -> the public key the phones need to subscribe
//   { action: "test" }                             -> a test notification to your own phones
//   { action: "brew", brew_id, ratings: [ids] }    -> "Andrés made you a coffee" to the people the brew is for
//   { action: "rated", rating_id }                 -> "Birte rated your coffee" to the person who made the brew (supabase/35)
// Secrets (Supabase > Edge Functions > Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
// The encryption is written out here (RFC 8291 and 8292) with the browser's own crypto, so nothing else is needed.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// ---------- web push ----------
const enc = new TextEncoder();
export const b64u = {
  enc: buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  dec: s => { const t = s.replace(/-/g, "+").replace(/_/g, "/"), b = atob(t + "===".slice((t.length + 3) % 4)); return Uint8Array.from(b, c => c.charCodeAt(0)); }
};
const cat = (...parts) => { const n = parts.reduce((a, p) => a + p.length, 0), out = new Uint8Array(n); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; }); return out; };
async function hmac(key, data) {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}
// the signed "who is sending" token for the push service of that phone (VAPID)
export async function vapidHeader(endpoint, pub, priv, subject) {
  const raw = b64u.dec(pub);
  const key = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", x: b64u.enc(raw.slice(1, 33)), y: b64u.enc(raw.slice(33, 65)), d: priv, ext: true }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = b64u.enc(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u.enc(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(head + "." + body));
  return "vapid t=" + head + "." + body + "." + b64u.enc(sig) + ", k=" + pub;
}
// the message, encrypted for that phone only (aes128gcm)
export async function encrypt(payload, p256dh, authSecret, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const ua = b64u.dec(p256dh), auth = b64u.dec(authSecret);
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const as = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", ua, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, pair.privateKey, 256));
  const prkKey = await hmac(auth, shared);
  const ikm = await hmac(prkKey, cat(enc.encode("WebPush: info\0"), ua, as, new Uint8Array([1])));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, cat(enc.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, cat(enc.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);
  const k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, cat(enc.encode(payload), new Uint8Array([2]))));
  const head = new Uint8Array(21); head.set(salt, 0); new DataView(head.buffer).setUint32(16, 4096); head[20] = 65;
  return cat(head, as, ct);
}
async function send(sub, msg, env) {
  const body = await encrypt(JSON.stringify(msg), sub.p256dh, sub.auth);
  const r = await fetch(sub.endpoint, {
    method: "POST", body,
    headers: { "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "86400", Urgency: "normal",
      Authorization: await vapidHeader(sub.endpoint, env.pub, env.priv, env.sub) }
  });
  return r.status;
}

// ---------- the function ----------
if (globalThis.Deno) Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const env = { pub: Deno.env.get("VAPID_PUBLIC_KEY") || "", priv: Deno.env.get("VAPID_PRIVATE_KEY") || "", sub: Deno.env.get("VAPID_SUBJECT") || "mailto:hello@alto-andino.com" };
  if (!env.pub || !env.priv) return json({ error: "The keys are missing: add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY under Edge Functions > Secrets." }, 500);
  let q = {}; try { q = await req.json(); } catch (e) {}
  if (q.action === "key") return json({ key: env.pub });
  // the person who called, with their own rights
  const db = createClient(Deno.env.get("SUPABASE_URL"), req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY"),
    { global: { headers: { Authorization: req.headers.get("Authorization") || "" } }, auth: { persistSession: false } });
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: u } = jwt ? await db.auth.getUser(jwt) : { data: null };
  if (!u || !u.user) return json({ error: "Not signed in." }, 401);
  const site = "https://alto-andino.com/";
  let targets = [], sent = 0, gone = 0;
  if (q.action === "test") {
    const { data, error } = await db.from("push_subscriptions").select("endpoint,p256dh,auth");
    if (error) return json({ error: error.message }, 500);
    targets = (data || []).map(s => ({ s, msg: { title: "Alto Andino", body: "Notifications are on. This is how “to rate” will look.", url: site + "index.html", tag: "test" } }));
  } else if (q.action === "brew" && q.brew_id) {
    const { data, error } = await db.rpc("push_targets", { p_brew: q.brew_id });
    if (error) return json({ error: error.message }, 500);
    const only = Array.isArray(q.ratings) && q.ratings.length ? new Set(q.ratings) : null;
    const dev = d => !d ? "" : " on the " + (/^(Manual|Semi-automatic|Moka|French|Pour|Cold|Filter|Fully)\b/.test(d) ? d[0].toLowerCase() + d.slice(1) : d);
    targets = (data || []).filter(t => !only || only.has(t.rating_id)).map(t => ({ s: t, msg: {
      title: t.maker + " made you a coffee", body: (t.coffee_name || "A coffee") + dev(t.device) + ". Tap to rate your cup.",
      url: site + "journal/index.html#c=" + t.coffee_id + "&b=" + q.brew_id + "&rate=" + t.rating_id, tag: "rate-" + t.rating_id } }));
  } else if (q.action === "rated" && q.rating_id) {
    const { data, error } = await db.rpc("push_rated_targets", { p_rating: q.rating_id });
    if (error) return json({ error: error.message }, 500);
    const dev = d => !d ? "" : " on the " + (/^(Manual|Semi-automatic|Moka|French|Pour|Cold|Filter|Fully)\b/.test(d) ? d[0].toLowerCase() + d.slice(1) : d);
    const stars = v => v == null ? "" : String(Math.round(Number(v) * 2) / 2).replace(/\.0$/, "") + "\u2605";
    targets = (data || []).map(t => ({ s: t, msg: {
      title: t.rater + " rated your coffee" + (t.rating != null ? ": " + stars(t.rating) : ""),
      body: (t.coffee_name || "A coffee") + dev(t.device) + (t.balance != null ? ", balance " + t.balance + "/5" : "") + ". Tap to see it.",
      url: site + "journal/index.html#c=" + t.coffee_id + "&b=" + t.brew_id, tag: "rated-" + q.rating_id } }));
  } else return json({ error: "Unknown action." }, 400);
  await Promise.all(targets.map(async t => {
    try {
      const st = await send(t.s, t.msg, env);
      if (st === 404 || st === 410) { gone++; await db.rpc("push_remove", { p_endpoint: t.s.endpoint }); } else if (st < 300) sent++;
    } catch (e) {}
  }));
  return json({ sent, gone, phones: targets.length });
});
