import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

interface ProductItem {
  name: string;
  price: number | string;
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

async function sendOrderEmail(details: {
  customerName: string;
  orderId: string;
  products: ProductItem[];
  totalAmount: number | string;
  deliveryAddress: string;
  estimatedDelivery: string;
  customerEmail: string;
}) {
  const { customerName, orderId, products, totalAmount, deliveryAddress, estimatedDelivery, customerEmail } = details;

  // Format products table
  const productsListHtml = products
    .map(
      (p) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); color: #ffffff; font-size: 14px;">
        <strong>${p.name}</strong> <span style="color: rgba(255,255,255,0.4); font-size: 12px;">x${p.quantity}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: right; color: #00e5ff; font-weight: 600; font-size: 14px;">
        &#8377;${p.price}
      </td>
    </tr>
  `
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Order Confirmed – VURLO</title>
</head>
<body style="margin:0;padding:0;background:#050508;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">✦ Your order is confirmed and being prepared — thank you for shopping with VURLO!</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050508;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#0d0d1a 0%,#12122a 100%);border-radius:20px 20px 0 0;padding:36px 40px;border:1px solid rgba(255,255,255,0.07);border-bottom:none;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td><span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.03em;">VURLO<span style="color:#7c3aed;">.</span></span></td>
            <td align="right"><span style="background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;font-size:10px;font-weight:700;letter-spacing:0.15em;padding:5px 12px;border-radius:20px;text-transform:uppercase;">Order Confirmed</span></td>
          </tr>
        </table>
      </td></tr>

      <!-- Hero -->
      <tr><td style="background:linear-gradient(135deg,#0d0d1a,#0f0f2a);padding:40px 40px 32px;border-left:1px solid rgba(255,255,255,0.07);border-right:1px solid rgba(255,255,255,0.07);">
        <div style="width:56px;height:56px;background:linear-gradient(135deg,#7c3aed22,#06b6d422);border:1px solid rgba(124,58,237,0.3);border-radius:16px;margin-bottom:20px;text-align:center;line-height:56px;font-size:24px;">✦</div>
        <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.02em;">Thank you, ${customerName}!</h1>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;">Your order has been received and is being prepared with care.</p>
      </td></tr>

      <!-- Order Meta -->
      <tr><td style="background:#0d0d1a;padding:0 40px 24px;border-left:1px solid rgba(255,255,255,0.07);border-right:1px solid rgba(255,255,255,0.07);">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;border-right:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:9px;font-weight:700;letter-spacing:0.14em;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:6px;">Order ID</div>
              <div style="font-size:14px;font-weight:700;color:#a78bfa;font-family:monospace;">#${orderId}</div>
            </td>
            <td style="padding:20px 24px;border-right:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:9px;font-weight:700;letter-spacing:0.14em;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:6px;">Est. Delivery</div>
              <div style="font-size:14px;font-weight:700;color:#22d3ee;">${estimatedDelivery}</div>
            </td>
            <td style="padding:20px 24px;">
              <div style="font-size:9px;font-weight:700;letter-spacing:0.14em;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:6px;">Status</div>
              <div style="font-size:13px;font-weight:600;color:#4ade80;">Processing</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Address -->
      <tr><td style="background:#0d0d1a;padding:0 40px 24px;border-left:1px solid rgba(255,255,255,0.07);border-right:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.14em;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:8px;">Delivering To</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:14px 18px;">📍 ${deliveryAddress}</div>
      </td></tr>

      <!-- Items -->
      <tr><td style="background:#0d0d1a;padding:0 40px 8px;border-left:1px solid rgba(255,255,255,0.07);border-right:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.14em;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:14px;">Items Ordered</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:rgba(255,255,255,0.3);text-transform:uppercase;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06);">Product</td>
            <td align="right" style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:rgba(255,255,255,0.3);text-transform:uppercase;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06);">Price</td>
          </tr>
          ${products.map(p => `
          <tr>
            <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04);color:#fff;font-size:14px;">${p.name} <span style="color:rgba(255,255,255,0.35);font-size:12px;">×${p.quantity}</span></td>
            <td align="right" style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04);color:#22d3ee;font-weight:600;font-size:14px;">&#8377;${p.price}</td>
          </tr>`).join('')}
          <tr>
            <td style="padding:18px 0 4px;font-size:15px;font-weight:700;color:#fff;">Total</td>
            <td align="right" style="padding:18px 0 4px;font-size:20px;font-weight:900;background:linear-gradient(90deg,#a78bfa,#22d3ee);-webkit-background-clip:text;color:#a78bfa;">&#8377;${totalAmount}</td>
          </tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:linear-gradient(135deg,#0a0a18,#0d0d1a);border-radius:0 0 20px 20px;padding:28px 40px;border:1px solid rgba(255,255,255,0.07);border-top:none;text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.25);">Questions? Email us at <a href="mailto:support@vurlo.store" style="color:#a78bfa;text-decoration:none;">support@vurlo.store</a></p>
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);">© 2026 VURLO. All rights reserved.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  // Human-friendly plain text fallback
  const text = `
Thank you for your order, ${customerName}!

Your order has been received and is currently being processed.

Order Summary:
- Order ID: #${orderId}
- Estimated Delivery: ${estimatedDelivery}
- Delivery Address: ${deliveryAddress}

Items Purchased:
${products.map((p) => `- ${p.name} x${p.quantity} (Price: &#8377;${p.price})`).join("\n")}

Total Amount: &#8377;${totalAmount}

If you have any questions, reply to this email or contact support@vurlo.store.
You received this email because you placed an order on Vurlo.store.
  `.trim();

  return sendEmailWithRetry({
    from: "VURLO <onboarding@vurlo.store>",
    to: [customerEmail],
    subject: "Your Order Confirmation",
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
