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

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Delivered – VURLO</title>
</head>
<body style="margin:0;padding:0;background:#050508;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">📦 Your VURLO package has arrived! We hope you love it.</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050508;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#071a0f,#0a2016);border-radius:20px 20px 0 0;padding:36px 40px;border:1px solid rgba(74,222,128,0.1);border-bottom:none;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td><span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.03em;">VURLO<span style="color:#4ade80;">.</span></span></td>
            <td align="right"><span style="background:linear-gradient(135deg,#16a34a,#22d3ee);color:#fff;font-size:10px;font-weight:700;letter-spacing:0.15em;padding:5px 12px;border-radius:20px;text-transform:uppercase;">Delivered ✓</span></td>
          </tr>
        </table>
      </td></tr>

      <!-- Hero -->
      <tr><td style="background:linear-gradient(135deg,#071a0f,#0a1a14);padding:40px 40px 32px;border-left:1px solid rgba(74,222,128,0.08);border-right:1px solid rgba(74,222,128,0.08);">
        <div style="width:56px;height:56px;background:linear-gradient(135deg,#4ade8022,#22d3ee22);border:1px solid rgba(74,222,128,0.3);border-radius:16px;margin-bottom:20px;text-align:center;line-height:56px;font-size:24px;">📦</div>
        <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.02em;">Your order arrived!</h1>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;">Hi ${customerName}, order <span style="color:#4ade80;font-weight:600;">#${orderId}</span> has been successfully delivered.</p>
      </td></tr>

      <!-- Items -->
      <tr><td style="background:#071a0f;padding:0 40px 24px;border-left:1px solid rgba(74,222,128,0.08);border-right:1px solid rgba(74,222,128,0.08);">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.14em;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:14px;">Items Delivered</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${deliveredItems.map(item => `
          <tr>
            <td style="padding:12px 16px;background:rgba(74,222,128,0.04);border:1px solid rgba(74,222,128,0.08);border-radius:10px;margin-bottom:8px;color:#fff;font-size:14px;display:block;margin-bottom:6px;">
              ✦ ${item.name} <span style="color:rgba(255,255,255,0.4);">× ${item.quantity}</span>
            </td>
          </tr>`).join('')}
        </table>
      </td></tr>

      <!-- CTA -->
      <tr><td style="background:#071a0f;padding:0 40px 32px;border-left:1px solid rgba(74,222,128,0.08);border-right:1px solid rgba(74,222,128,0.08);text-align:center;">
        <p style="font-size:14px;color:rgba(255,255,255,0.45);margin:0 0 20px;">Enjoying your purchase? We'd love to hear from you.</p>
        <a href="https://vurlo.store" style="display:inline-block;background:linear-gradient(135deg,#16a34a,#0d9488);color:#fff;font-size:13px;font-weight:700;letter-spacing:0.05em;padding:14px 32px;border-radius:50px;text-decoration:none;">Shop Again at VURLO</a>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:linear-gradient(135deg,#050f07,#071a0f);border-radius:0 0 20px 20px;padding:28px 40px;border:1px solid rgba(74,222,128,0.08);border-top:none;text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.25);">Questions? <a href="mailto:support@vurlo.store" style="color:#4ade80;text-decoration:none;">support@vurlo.store</a></p>
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);">© 2026 VURLO. All rights reserved.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

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
    from: "VURLO <onboarding@vurlo.store>",
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

  const secret = req.headers["x-internal-secret"];
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
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
