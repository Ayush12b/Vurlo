import { Resend } from "resend";

export interface ProductItem {
  name: string;
  price: number | string;
  quantity: number;
}

// Helper wrapper for Resend SDK with automatic retry mechanism (up to 2 retries)
export async function sendEmailWithRetry(payload: any, retries = 2): Promise<any> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not defined in server environment variables.");
  }
  const resend = new Resend(apiKey);

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        ...payload,
        // Standard headers to tell spam filters this is an automated transactional email
        headers: {
          "Auto-Submitted": "auto-generated",
          "X-Auto-Response-Suppress": "All",
          ...payload.headers,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      console.log(`[Email Dispatch] Success on attempt ${attempt} (ID: ${data?.id})`);
      return data;
    } catch (err: any) {
      console.warn(`[Email Dispatch] Attempt ${attempt} failed: ${err.message}`);
      if (attempt > retries) {
        throw err;
      }
      // Exponential backoff delay
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

// ── 1. SEND ORDER CONFIRMATION EMAIL ──
export async function sendOrderEmail(details: {
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

// ── 2. SEND DELIVERY COMPLETED EMAIL ──
export type DeliveredItem = {
  name: string;
  quantity: number;
};

export async function sendDeliveryEmail(data: {
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

// ── 3. SEND PASSWORD RESET EMAIL ──
export async function sendResetPasswordEmail(details: {
  email: string;
  resetLink: string;
  expiryMinutes?: number;
}) {
  const { email, resetLink, expiryMinutes = 20 } = details;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #030308;
          color: #ededf0;
          padding: 24px;
          margin: 0;
        }
        .container {
          max-width: 500px;
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
          margin: 0 0 12px 0;
          letter-spacing: -0.02em;
        }
        p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.6;
          margin: 0 0 24px 0;
        }
        .btn-container {
          text-align: center;
          margin: 32px 0;
        }
        .btn {
          display: inline-block;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #ffffff !important;
          background: linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%);
          padding: 14px 30px;
          border-radius: 12px;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.25);
        }
        .security-note {
          background-color: rgba(239, 68, 68, 0.03);
          border-left: 3px solid #ef4444;
          padding: 12px 16px;
          border-radius: 4px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.5;
          margin: 28px 0;
        }
        .footer {
          margin-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 20px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.25);
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">Vurlo<span class="brand-cyan">.store</span></div>
        </div>
        
        <h1>Password Reset Request</h1>
        <p>
          We received a request to reset the password associated with your email address (${email}). Click the button below to secure a new password:
        </p>

        <div class="btn-container">
          <a href="${resetLink}" class="btn" target="_blank">Reset Password</a>
        </div>

        <p style="font-size: 13px; color: rgba(255,255,255,0.5);">
          This password reset link is valid for <strong>${expiryMinutes} minutes</strong>. After that time, you will need to submit a new recovery request.
        </p>

        <div class="security-note">
          <strong>Security Warning:</strong> If you did not make this request, please ignore this email. Your current password remains active and secure.
        </div>

        <div class="footer">
          Sent automatically by Vurlo.store Accounts System.<br>
          You received this email because you requested a password reset on Vurlo.store.<br>
          &copy; 2026 Vurlo.store. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // Human-friendly plain text fallback
  const text = `
Password Reset Request

We received a request to reset the password associated with your email address (${email}).

Reset Link:
${resetLink}

This password reset link is valid for ${expiryMinutes} minutes. If you did not request this reset, please ignore this email.
You received this email because you requested a password reset on Vurlo.store.
  `.trim();

  return sendEmailWithRetry({
    from: "onboarding@vurlo.store",
    to: [email],
    subject: "Reset your password",
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": email + "-reset",
    },
  });
}

// ── 4. SEND CONTACT FORM NOTIFICATION EMAIL ──
export async function sendContactNotificationEmail(details: {
  name: string;
  email: string;
  message: string;
  timestamp: string;
  receiverEmails: string[];
}) {
  const { name, email, message, timestamp, receiverEmails } = details;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
        .field {
          margin-bottom: 20px;
        }
        .label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 6px;
        }
        .value {
          font-size: 14px;
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 12px 16px;
        }
        .message-box {
          white-space: pre-wrap;
          line-height: 1.6;
          color: #e2e2e9;
        }
        .footer {
          margin-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 20px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.25);
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">Vurlo<span class="brand-cyan">.store</span></div>
        </div>
        <h1>New Contact Inquiry</h1>
        <div class="field">
          <div class="label">User Name</div>
          <div class="value">${name}</div>
        </div>
        <div class="field">
          <div class="label">User Email</div>
          <div class="value">${email}</div>
        </div>
        <div class="field">
          <div class="label">Submitted At</div>
          <div class="value">${timestamp}</div>
        </div>
        <div class="field">
          <div class="label">Message</div>
          <div class="value message-box">${message}</div>
        </div>
        <div class="footer">
          Sent automatically by Vurlo.store Support System.<br>
          &copy; 2026 Vurlo.store. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Contact Inquiry Received

- User Name: ${name}
- User Email: ${email}
- Submitted At: ${timestamp}

Message:
${message}

Sent automatically by Vurlo.store Support System.
  `.trim();

  return sendEmailWithRetry({
    from: "onboarding@vurlo.store",
    to: receiverEmails,
    subject: `New Inquiry Received - from ${name}`,
    html,
    text,
    replyTo: email,
  });
}

// ── 5. SEND CONTACT FORM AUTO-REPLY EMAIL ──
export async function sendContactAutoReplyEmail(details: {
  name: string;
  email: string;
  message: string;
}) {
  const { name, email, message } = details;
  const shortMessage = message.length > 120 ? message.slice(0, 120) + "..." : message;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>We received your message</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
          margin: 0 0 12px 0;
        }
        p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin: 0 0 16px 0;
        }
        .summary {
          background-color: rgba(255, 255, 255, 0.02);
          border-left: 3px solid #7c3aed;
          padding: 12px 16px;
          margin: 20px 0;
          font-style: italic;
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.6);
          border-radius: 0 8px 8px 0;
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
        <h1>We've received your message</h1>
        <p>Hi ${name},</p>
        <p>
          Thank you for reaching out to Vurlo. We have successfully received your inquiry and our support team is currently reviewing it.
        </p>
        <p>
          We strive to answer all questions as quickly as possible. You can expect a response from us within 24 hours.
        </p>
        <div class="summary">
          <strong>Your message summary:</strong><br>
          "${shortMessage}"
        </div>
        <div class="footer">
          Need support? Reply to this message or contact <a href="mailto:support@vurlo.store" style="color: #a78bfa; text-decoration: none;">support@vurlo.store</a>.<br>
          You received this email because you submitted a contact inquiry on Vurlo.store.<br>
          &copy; 2026 Vurlo.store. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${name},

Thank you for reaching out to Vurlo support. We have successfully received your message and our team is already reviewing it.

We strive to address all requests as quickly as possible. You can expect a response from us within 24 hours.

Your message summary:
"${message}"

If you have any questions, reply to this email or contact support@vurlo.store.
You received this email because you submitted a contact inquiry on Vurlo.store.
  `.trim();

  return sendEmailWithRetry({
    from: "onboarding@vurlo.store",
    to: [email],
    subject: "We received your complaint",
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": email + "-contact",
    },
  });
}
