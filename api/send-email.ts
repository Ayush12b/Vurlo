import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import * as admin from "firebase-admin";
import { IncomingForm } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
const adminDb = admin.firestore();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmailWithRetry(payload: any, retries = 1): Promise<any> {
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
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

async function sendContactNotificationEmail(details: {
  name: string;
  email: string;
  message: string;
  timestamp: string;
  receiverEmails: string[];
  attachments?: { filename: string; content: Buffer }[];
}) {
  const { name, email, message, timestamp, receiverEmails, attachments } = details;

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
    from: "VURLO <onboarding@vurlo.store>",
    to: receiverEmails,
    subject: `New Inquiry Received - from ${name}`,
    html,
    text,
    replyTo: email,
    headers: {
      "X-Entity-Ref-ID": email + "-notify",
      Precedence: "bulk",
      "List-Unsubscribe": "<mailto:support@vurlo.store>",
    },
    ...(attachments?.length ? { attachments } : {}),
  });
}

async function sendContactAutoReplyEmail(details: {
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
    from: "VURLO <onboarding@vurlo.store>",
    to: [email],
    subject: "We received your complaint",
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": email + "-contact",
    },
  });
}

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
    return res
      .status(429)
      .json({ error: "Too many submissions. Please wait 15 seconds before trying again." });
  }

  try {
    // Parse multipart form data
    const parseForm = (): Promise<{ fields: any; files: any }> =>
      new Promise((resolve, reject) => {
        const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024, multiples: true });
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

    const { fields, files: uploadedFiles } = await parseForm();
    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
    const message = Array.isArray(fields.message) ? fields.message[0] : fields.message;

    const attachments: { filename: string; content: Buffer }[] = [];
    const rawFiles = uploadedFiles?.files
      ? Array.isArray(uploadedFiles.files)
        ? uploadedFiles.files
        : [uploadedFiles.files]
      : [];
    for (const f of rawFiles) {
      if (f.filepath) {
        attachments.push({
          filename: f.originalFilename || "file",
          content: fs.readFileSync(f.filepath),
        });
      }
    }

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
      attachments,
    });

    // Save to Firestore contacts collection
    try {
      await adminDb.collection("contacts").add({
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });
    } catch (fsErr: any) {
      console.warn("Firestore contacts save failed:", fsErr.message);
      // Non-fatal — email already sent
    }

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
    return res.status(500).json({ error: "Something went wrong. Please try again later." });
  }
}
