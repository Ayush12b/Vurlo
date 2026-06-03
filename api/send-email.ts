import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendContactNotificationEmail, sendContactAutoReplyEmail } from "./_lib/emails";

// Simple in-memory rate limiting map
const ipCache = new Map<string, number>();

// Rate limit: 1 request every 15 seconds per IP
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastTime = ipCache.get(ip);
  if (lastTime && now - lastTime < 15000) {
    return true;
  }
  ipCache.set(ip, now);

  // Periodically clean up cache to prevent memory leaks
  if (ipCache.size > 500) {
    for (const [key, val] of ipCache.entries()) {
      if (now - val > 15000) {
        ipCache.delete(key);
      }
    }
  }
  return false;
}

// Basic HTML escaping sanitizer
function sanitize(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "https://vurlo.store");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  console.log("API HIT");
  console.log("[send-email] API hit, method:", req.method);
  console.log("BODY:", req.body);

  if (req.method === "OPTIONS") {
    return res.status(200).json({ success: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Rate limiting check
  const xForwardedFor = req.headers["x-forwarded-for"] as string;
  const ip = xForwardedFor
    ? xForwardedFor.split(",")[0].trim()
    : req.socket.remoteAddress || "anonymous";

  if (checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many submissions. Please wait 15 seconds before trying again." });
  }

  try {
    const body = req.body || {};
    console.log("[send-email] Request body:", body);
    const { name, email, message } = body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required." });
    }
    if (!email || !email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "A valid email address is required." });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message content is required." });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ error: "Name cannot exceed 100 characters." });
    }
    if (message.trim().length > 5000) {
      return res.status(400).json({ error: "Message cannot exceed 5000 characters." });
    }

    // Sanitize inputs
    const cleanName = sanitize(name.trim());
    const cleanEmail = sanitize(email.trim());
    const cleanMessage = sanitize(message.trim());
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "UTC" }) + " UTC";

    // Setup receiver emails (support environment variable or fallback to 2 standard addresses)
    const receiverEmails = process.env.COMPLAINTS_RECEIVER_EMAIL
      ? [process.env.COMPLAINTS_RECEIVER_EMAIL]
      : ["hello@vurlo.store", "ayush@vurlo.store"];

    // Send notification email to the workspace/owner inbox
    const notificationResult = await sendContactNotificationEmail({
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      timestamp,
      receiverEmails,
    });

    // Send auto-reply confirmation email to the user
    try {
      await sendContactAutoReplyEmail({
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
      });
    } catch (autoReplyErr: any) {
      console.warn("Resend user auto-reply failed to dispatch:", autoReplyErr.message);
      // We still return 200 since the core notification succeeded
    }

    return res.status(200).json({ success: true, id: notificationResult?.id });
  } catch (err: any) {
    console.error("ERROR:", err);
    console.error("Unexpected error in send-email API:", err);
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}
