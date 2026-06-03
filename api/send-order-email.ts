import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendOrderEmail } from "./_lib/emails";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "https://vurlo.store");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  console.log("API HIT");
  console.log("[send-order-email] API hit, method:", req.method);
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
    return res.status(429).json({ error: "Rate limit exceeded. Please wait a few seconds." });
  }

  try {
    const body = req.body || {};
    console.log("[send-order-email] Request body:", JSON.stringify(body).slice(0, 200));
    const {
      orderId,
      customerName,
      customerEmail,
      products,
      totalAmount,
      deliveryAddress,
      estimatedDelivery,
    } = body;

    // Validate inputs
    if (!orderId || !customerName || !customerEmail || !products || !totalAmount || !deliveryAddress || !estimatedDelivery) {
      return res.status(400).json({ error: "Missing required order information fields." });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Products list must be a non-empty array." });
    }

    if (products.length > 50) {
      return res.status(400).json({ error: "Products list cannot exceed 50 items." });
    }

    if (!/^\S+@\S+\.\S+$/.test(customerEmail)) {
      return res.status(400).json({ error: "Invalid customer email address." });
    }

    // Sanitize and clamp inputs
    const sanitizedCustomerName = sanitize(customerName).slice(0, 100);
    const sanitizedDeliveryAddress = sanitize(deliveryAddress).slice(0, 300);
    const sanitizedOrderId = sanitize(orderId).slice(0, 50);
    const sanitizedEstimatedDelivery = sanitize(estimatedDelivery).slice(0, 100);
    const clampedTotal = Number(totalAmount) || 0;
    const sanitizedProducts = products.map((p: any) => ({
      name: sanitize(p.name).slice(0, 100),
      quantity: Math.max(1, Math.min(100, Number(p.quantity) || 1)),
      price: Number(p.price) || 0,
    }));

    // Call reusable email function
    const data = await sendOrderEmail({
      customerName: sanitizedCustomerName,
      orderId: sanitizedOrderId,
      products: sanitizedProducts,
      totalAmount: clampedTotal,
      deliveryAddress: sanitizedDeliveryAddress,
      estimatedDelivery: sanitizedEstimatedDelivery,
      customerEmail,
    });

    return res.status(200).json({ success: true, id: data?.id });
  } catch (error: any) {
    console.error("ERROR:", error);
    console.error("Error dispatching order confirmation email:", error);
    return res.status(500).json({ error: error.message || "Internal error" });
  }
}
