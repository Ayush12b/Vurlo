import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendDeliveryEmail } from "./_lib/emails";

const ipCache = new Map<string, number>();

// Rate limit: 1 request every 10 seconds per IP
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (ipCache.size > 500) {
    for (const [key, timestamp] of ipCache.entries()) {
      if (now - timestamp > 10000) {
        ipCache.delete(key);
      }
    }
  }
  const lastTime = ipCache.get(ip);
  if (lastTime && now - lastTime < 10000) {
    return true;
  }
  ipCache.set(ip, now);
  return false;
}

function sanitize(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "\"": return "&quot;";
      case "'": return "&#x27;";
      default: return m;
    }
  });
}

async function parseBody(req: VercelRequest): Promise<any> {
  let body = req.body;
  if (!body) {
    body = req;
  }

  if (body instanceof Buffer) {
    try {
      return JSON.parse(body.toString("utf-8"));
    } catch {
      return {};
    }
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  if (body && typeof body.on === "function") {
    try {
      const chunks: any[] = [];
      await new Promise<void>((resolve, reject) => {
        body.on("data", (chunk: any) => chunks.push(chunk));
        body.on("end", () => resolve());
        body.on("error", (err: any) => reject(err));
      });
      const buffer = Buffer.concat(chunks);
      return JSON.parse(buffer.toString("utf-8"));
    } catch {
      return {};
    }
  }

  return body && typeof body === "object" ? body : {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers set before any guard clause
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "https://vurlo.store");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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
    return res.status(429).json({ error: "Rate limit exceeded. Please wait a few seconds." });
  }

  try {
    let body: any;
    try {
      body = await parseBody(req);
    } catch (err: any) {
      console.error("[send-delivery-email] body parsing failed:", err);
      return res.status(400).json({ error: "Invalid request payload format." });
    }

    const { orderId, customerEmail, customerName, deliveredItems } = body;

    // Validate inputs explicitly
    if (!orderId || !customerEmail || !customerName || !deliveredItems) {
      return res.status(400).json({ error: "Missing required delivery information fields." });
    }

    if (typeof orderId !== "string" || typeof customerEmail !== "string" || typeof customerName !== "string") {
      return res.status(400).json({ error: "Required fields (orderId, customerEmail, customerName) must be strings." });
    }

    if (!Array.isArray(deliveredItems) || deliveredItems.length === 0) {
      return res.status(400).json({ error: "Delivered items list must be a non-empty array." });
    }

    if (deliveredItems.length > 50) {
      return res.status(400).json({ error: "Delivered items list cannot exceed 50 items." });
    }

    for (let i = 0; i < deliveredItems.length; i++) {
      const item = deliveredItems[i];
      if (!item || typeof item !== "object") {
        return res.status(400).json({ error: `Delivered item at index ${i} is not a valid object.` });
      }
      if (!item.name || typeof item.name !== "string") {
        return res.status(400).json({ error: `Delivered item at index ${i} has an invalid or missing name.` });
      }
      if (item.quantity === undefined || isNaN(Number(item.quantity))) {
        return res.status(400).json({ error: `Delivered item at index ${i} has an invalid quantity.` });
      }
    }

    if (!/^\S+@\S+\.\S+$/.test(customerEmail)) {
      return res.status(400).json({ error: "Invalid customer email address." });
    }

    // Sanitize and clamp inputs
    const sanitizedCustomerName = sanitize(customerName).slice(0, 100);
    const sanitizedOrderId = sanitize(orderId).slice(0, 50);
    const sanitizedDeliveredItems = deliveredItems.map((item: any) => ({
      name: sanitize(item.name).slice(0, 100),
      quantity: Math.max(1, Math.min(100, Number(item.quantity) || 1)),
    }));

    // Call reusable email function wrapped in its own try-catch
    let data;
    try {
      data = await sendDeliveryEmail({
        orderId: sanitizedOrderId,
        deliveredItems: sanitizedDeliveredItems,
        customerEmail,
        customerName: sanitizedCustomerName,
      });
    } catch (error: any) {
      console.error("[send-delivery-email] sendDeliveryEmail failed:", error);
      return res.status(502).json({ error: error.message || "Failed to send delivery email." });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (error: any) {
    console.error("[send-delivery-email] unexpected error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

