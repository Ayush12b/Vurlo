import * as admin from "firebase-admin";

export function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
        });
        console.log("[Firebase Admin] Successfully initialized with environment credentials.");
      } catch (err) {
        console.error("[Firebase Admin] Initialization failed: ", err);
      }
    } else {
      // Fallback: Default initialization (e.g. for Vercel integration or local configurations)
      try {
        admin.initializeApp();
        console.log("[Firebase Admin] Initialized with default server credentials.");
      } catch (err) {
        console.warn(
          "[Firebase Admin] Offline. Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY for email auth resets."
        );
      }
    }
  }
  return admin.apps.length > 0 ? admin : null;
}
