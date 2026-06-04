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
        ₹${p.price}
      </td>
    </tr>
  `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order Confirmation</title>
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
        .table-container {
          margin: 24px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        .details-grid {
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .details-row {
          margin-bottom: 12px;
        }
        .details-row:last-child {
          margin-bottom: 0;
        }
        .label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 4px;
        }
        .value {
          font-size: 13px;
          color: #ffffff;
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
        
        <h1>Thank you for your order!</h1>
        <p>Hi ${customerName},</p>
        <p>Your order has been received and is currently being processed. Here is a summary of your order details:</p>
 
        <div class="details-grid">
          <div class="details-row">
            <div class="label">Order ID</div>
            <div class="value" style="font-family: monospace; font-size: 14px; font-weight: bold; color: #a78bfa;">#${orderId}</div>
          </div>
          <div class="details-row">
            <div class="label">Estimated Delivery</div>
            <div class="value" style="font-weight: 600; color: #22d3ee;">${estimatedDelivery}</div>
          </div>
          <div class="details-row">
            <div class="label">Delivery Address</div>
            <div class="value">${deliveryAddress}</div>
          </div>
        </div>
 
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="text-align: left; padding-bottom: 8px; border-bottom: 2px solid rgba(255,255,255,0.08); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.4);">Item</th>
                <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid rgba(255,255,255,0.08); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.4);">Price</th>
              </tr>
            </thead>
            <tbody>
              ${productsListHtml}
              <tr>
                <td style="padding: 16px 0 0 0; font-size: 15px; font-weight: bold; color: #ffffff;">Total Amount</td>
                <td style="padding: 16px 0 0 0; text-align: right; font-size: 18px; font-weight: 800; color: #00e5ff;">₹${totalAmount}</td>
              </tr>
            </tbody>
          </table>
        </div>
 
        <div class="footer">
          If you have any questions or need to make changes, reach out to us at <a href="mailto:support@vurlo.store" style="color: #a78bfa; text-decoration: none;">support@vurlo.store</a>.<br>
          You received this email because you placed an order on Vurlo.store.<br>
          &copy; 2026 Vurlo.store. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // Human-friendly plain text fallback
  const text = `
Thank you for your order, ${customerName}!

Your order has been received and is currently being processed.

Order Summary:
- Order ID: #${orderId}
- Estimated Delivery: ${estimatedDelivery}
- Delivery Address: ${deliveryAddress}

Items Purchased:
${products.map((p) => `- ${p.name} x${p.quantity} (Price: ₹${p.price})`).join("\n")}

Total Amount: ₹${totalAmount}

If you have any questions, reply to this email or contact support@vurlo.store.
You received this email because you placed an order on Vurlo.store.
  `.trim();

  return sendEmailWithRetry({
    from: "onboarding@vurlo.store",
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
