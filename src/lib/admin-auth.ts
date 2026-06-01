import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Deprecated: Admin access is now strictly role-based in Firestore.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  return false;
}

/**
 * Checks if a user is an admin by querying their document in the 'users' collection.
 */
export async function checkIsAdmin(
  uid: string,
  email: string | null | undefined,
): Promise<boolean> {
  if (!uid) return false;

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.role === "admin";
    }
  } catch (error) {
    console.error("[Admin Auth] Error checking admin role in Firestore:", error);
  }

  return false;
}
