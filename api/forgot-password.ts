import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFirebaseAdmin } from "./_lib/firebase-admin";
import { sendResetPasswordEmail } from "./_lib/emails";

const ipCache = new Map<string, number>();

// Rate limit: 1 request every 20 seconds per IP
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (ipCache.size > 500) {
    for (const [key, timestamp] of ipCache.entries()) {
      if (now - timestamp > 20000) {
        ipCache.delete(key);
      }
    }
  }
  const lastTime = ipCache.get(ip);
  if (lastTime && now - lastTime < 20000) {
    return true;
  }
  ipCache.set(ip, now);
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "https://vurlo.store");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  console.log("API HIT");
  console.log("[forgot-password] API hit, method:", req.method);
  console.log("BODY:", req.body);

  if (req.method === "OPTIONS") {
    return res.status(200).json({ success: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const xForwardedFor = req.headers["x-forwarded-for"] as string;
  const ip = xForwardedFor
    ? xForwardedFor.split(",")[0].trim()
    : req.socket.remoteAddress || "anonymous";

  if (checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many reset attempts. Please wait 20 seconds." });
  }

  try {
    const body = req.body || {};
    console.log("[forgot-password] Request body:", body);
    const { email } = body;
    if (!email || !email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    const admin = getFirebaseAdmin();
    if (!admin) {
      // If admin SDK is not configured, fallback gracefully so local testing doesn't break
      return res.status(501).json({
        error: "Firebase Admin is not configured on the server. Set up environment credentials.",
      });
    }

    // Verify user exists first to prevent spam/abuse
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email.trim());
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        // Return 200 to prevent user enumeration security disclosure
        return res.status(200).json({
          success: true,
          message: "If the email exists, a password reset link has been dispatched.",
        });
      }
      throw err;
    }

    // Generate Firebase password reset link (expiring naturally via Firebase, usually 1 hour)
    const host = req.headers.host || "vurlo.store";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const resetLink = await admin.auth().generatePasswordResetLink(email.trim(), {
      url: `${origin}/reset-password`,
    });

    // Send the email via Resend
    await sendResetPasswordEmail({
      email: email.trim(),
      resetLink,
      expiryMinutes: 60,
    });

    // Add Password Reset Notification to Firestore
    try {
      const dbAdmin = admin.firestore();
      await dbAdmin.collection("notifications").add({
        userId: userRecord.uid,
        message: "A password reset request was initiated for your account. If this wasn't you, please secure your account credentials.",
        type: "alert",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        link: "/profile",
      });
    } catch (dbErr) {
      console.error("Failed to write password reset notification:", dbErr);
    }

    return res.status(200).json({
      success: true,
      message: "If the email exists, a password reset link has been dispatched.",
    });
  } catch (error: any) {
    console.error("ERROR:", error);
    console.error("Error in forgot-password handler:", error);
    return res.status(500).json({ error: error.message || "Internal error" });
  }
}
