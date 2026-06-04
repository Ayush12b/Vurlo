import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "./_lib/firebase-admin";

export const config = {
  api: {
    bodyParser: true,
  },
};

const ipCache = new Map<string, number>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (ipCache.size > 500) {
    for (const [key, timestamp] of ipCache.entries()) {
      if (now - timestamp > 20000) ipCache.delete(key);
    }
  }
  const lastTime = ipCache.get(ip);
  if (lastTime && now - lastTime < 20000) return true;
  ipCache.set(ip, now);
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "https://vurlo.store");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).json({ success: true });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid request body. Expected JSON object." });
    }

    const email: string | undefined = body.email;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket?.remoteAddress || "unknown";
    if (checkRateLimit(ip)) {
      return res.status(429).json({ error: "Too many requests. Please wait 20 seconds." });
    }

    console.log("[forgot-password] Generating reset link for:", email);

    await admin.auth().generatePasswordResetLink(email);

    console.log("[forgot-password] Reset link generated successfully for:", email);

    return res.status(200).json({
      success: true,
      message: "Password reset email sent successfully.",
    });

  } catch (error: any) {
    console.error("[forgot-password] ERROR:", error?.code, error?.message, error);

    const isFirebaseError = error?.code?.startsWith("auth/");

    return res.status(500).json({
      success: false,
      error: isFirebaseError
        ? `Firebase error: ${error.message}`
        : `Internal error: ${error?.message || "Unknown error"}`,
      code: error?.code || null,
    });
  }
}
