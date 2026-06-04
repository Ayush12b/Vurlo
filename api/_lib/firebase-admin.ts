import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error(
      `Firebase Admin env vars missing: PROJECT_ID=${process.env.FIREBASE_PROJECT_ID}, CLIENT_EMAIL=${process.env.FIREBASE_CLIENT_EMAIL}, PRIVATE_KEY=${privateKey ? "[SET]" : "[MISSING]"}`
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export default admin;
