import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

interface DeliveredItem {
  name: string;
  quantity: number;
}

async function sendEmailWithRetry(payload: any, retries = 2): Promise<any> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        ...payload,
        headers: {
          "Auto-Submitted": "auto-generated",
          "X-Auto-Response-Suppress": "All",
          ...payload.headers,
        },
      });
      if (error) throw new Error(error.message);
      return data;
    } catch (err: any) {
      if (attempt > retries) throw err;
      await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }
}

async function sendDeliveryEmail(data: {
  orderId: string;
  deliveredItems: DeliveredItem[];
  customerEmail: string;
  customerName: string;
}) {
  const { orderId, deliveredItems, customerEmail, customerName } = data;

  const itemsHtml = deliveredItems
    .map(
      (item) => `
    <li style="margin-bottom: 8px; color: #ffffff; font-size: 13.5px;">
      <span style="color: #00e5ff; font-weight: bold; margin-right: 6px;">✓</span>
      ${item.name} <span style="color: rgba(255,255,255,0.4); font-size: 11px;">(Qty: ${item.quantity})</span>
    </li>
  `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order Has Been Delivered</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #030308;
          color: #ededf0;
          padding: 24px;
          margin: 0;
        }
        .container {
          max-width: 580px;
          margin: 0 auto;
          background-color: #0b0b12;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
        }
        .header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 20px;
          margin-bottom: 28px;
        }
        .brand {
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .brand-cyan {
          color: #00e5ff;
        }
        h1 {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 10px 0;
          letter-spacing: -0.02em;
        }
        p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          margin: 0 0 20px 0;
        }
        .items-box {
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        ul {
          list-style: none;
          padding: 0;
          margin: 12px 0 0 0;
        }
        .footer {
          margin-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 20px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.25);
          text-align: center;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">Vurlo<span class="brand-cyan">.store</span></div>
        </div>
        
        <h1>Your package has arrived!</h1>
        <p>Hi ${customerName},</p>
        <p>We are pleased to inform you that your order has been successfully delivered. We hope you love your new setup addition!</p>
 
        <div class="items-box">
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255, 255, 255, 0.4);">Delivered Items (Order #${orderId})</div>
          <ul>
            ${itemsHtml}
          </ul>
        </div>
 
        <p>If you have any feedback or concerns regarding the delivery, please don't hesitate to reach out to our team.</p>
 
        <div class="footer">
          Need support? Reply to this message or contact <a href="mailto:support@vurlo.store" style="color: #a78bfa; text-decoration: none;">support@vurlo.store</a>.<br>
          You received this email because your Vurlo order was successfully delivered.<br>
          &copy; 2026 Vurlo.store. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // Human-friendly plain text fallback
  const text = `
Your Vurlo package has arrived, ${customerName}!

We are pleased to inform you that order #${orderId} has been successfully delivered.

Delivered Items:
${deliveredItems.map((item) => `- ${item.name} (Qty: ${item.quantity})`).join("\n")}

If you have any questions or feedback, reply directly to this email or reach out to support@vurlo.store.
You received this email because your Vurlo order was successfully delivered.
  `.trim();

  return sendEmailWithRetry({
    from: "onboarding@vurlo.store",
    to: [customerEmail],
    subject: "Your order has been delivered",
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": orderId,
    },
  });
}

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
