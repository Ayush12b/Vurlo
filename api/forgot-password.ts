import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";

if (!admin.apps || !admin.apps.length) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
}

export const config = { api: { bodyParser: true } };

const fpIpCache = new Map<string, number>();
function checkFpRateLimit(ip: string): boolean {
  const now = Date.now();
  const last = fpIpCache.get(ip);
  if (last && now - last < 60000) return true; // 1 request per minute per IP
  fpIpCache.set(ip, now);
  if (fpIpCache.size > 500) {
    for (const [k, v] of fpIpCache.entries()) {
      if (now - v > 60000) fpIpCache.delete(k);
    }
  }
  return false;
}

const fpEmailCache = new Map<string, number>();
function checkFpEmailRateLimit(email: string): boolean {
  const now = Date.now();
  const last = fpEmailCache.get(email);
  if (last && now - last < 60000) return true;
  fpEmailCache.set(email, now);
  if (fpEmailCache.size > 500) {
    for (const [k, v] of fpEmailCache.entries()) {
      if (now - v > 60000) fpEmailCache.delete(k);
    }
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "https://vurlo.store");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "anon";
  if (checkFpRateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests. Please wait before trying again." });
  }

  const email = req.body?.email;
  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  if (checkFpEmailRateLimit(email)) {
    return res.status(429).json({
      error: "A reset email was already sent to this address. Please wait 60 seconds.",
    });
  }

  try {
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: `VURLO <${process.env.RESEND_FROM_EMAIL ?? "noreply@vurlo.store"}>`,
      to: email,
      subject: "Reset your VURLO password",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your VURLO password</title>
</head>
<body style="margin:0;padding:24px;background-color:#030308;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background-color:#0b0b12;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px;box-shadow:0 20px 40px rgba(0,0,0,0.6);">

    <div style="border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:20px;margin-bottom:28px;">
      <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
        Vurlo<span style="color:#00e5ff;">.store</span>
      </span>
    </div>

    <h1 style="font-size:20px;font-weight:700;color:#ffffff;margin:0 0 12px 0;letter-spacing:-0.02em;">
      Reset your password
    </h1>

    <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;margin:0 0 24px 0;">
      We received a request to reset the password for your Vurlo account. Click the button below to choose a new password. This link expires in 1 hour.
    </p>

    <a href="${resetLink}"
      style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed 0%,#22d3ee 100%);color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.04em;text-transform:uppercase;">
      Reset Password
    </a>

    <p style="font-size:12px;color:rgba(255,255,255,0.3);line-height:1.6;margin:28px 0 0 0;">
      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
    </p>

    <div style="margin-top:32px;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;font-size:11px;color:rgba(255,255,255,0.2);text-align:center;line-height:1.5;">
      Sent by Vurlo.store &nbsp;·&nbsp;
      <a href="mailto:support@vurlo.store" style="color:#a78bfa;text-decoration:none;">support@vurlo.store</a><br>
      &copy; 2026 Vurlo.store. All rights reserved.
    </div>

  </div>
</body>
</html>`,
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("[forgot-password]", err?.code, err?.message);
    return res.status(200).json({ success: true }); // Always return success to prevent email enumeration
  }
}
