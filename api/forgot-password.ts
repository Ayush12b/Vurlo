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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "https://vurlo.store");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.socket.remoteAddress || "anon";
  if (checkFpRateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests. Please wait before trying again." });
  }

  const email = req.body?.email;
  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  try {
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: `VURLO <${process.env.RESEND_FROM_EMAIL ?? "noreply@vurlo.store"}>`,
      to: email,
      subject: "Reset your VURLO password",
      html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("[forgot-password]", err?.code, err?.message);
    return res.status(200).json({ success: true }); // Always return success to prevent email enumeration
  }
}
