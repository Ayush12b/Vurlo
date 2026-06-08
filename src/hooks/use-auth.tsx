import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238b5cf6'><path d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 14.2a7.2 7.2 0 0 1-6-3.18c.025-1.99 4-3.08 6-3.08 1.99 0 5.975 1.09 6 3.08a7.2 7.2 0 0 1-6 3.18z'/></svg>";

interface AuthContextType {
  user: User | null;
  profileName: string | null;
  profilePhoto: string | null;
  loading: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateProfileName: (newName: string) => Promise<void>;
  savedAddress: { name: string; address: string; city: string; state: string; pinCode: string; phone: string } | null;
  saveAddress: (addr: { name: string; address: string; city: string; state: string; pinCode: string; phone: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [savedAddress, setSavedAddress] = useState<{ name: string; address: string; city: string; state: string; pinCode: string; phone: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfileName(data.name || currentUser.displayName || "User");
            setProfilePhoto(data.photoURL || currentUser.photoURL || DEFAULT_AVATAR);
            if (data.savedAddress) setSavedAddress(data.savedAddress);
          } else {
            try { await currentUser.reload(); } catch {}
            setProfileName(currentUser.displayName || "User");
            setProfilePhoto(currentUser.photoURL || DEFAULT_AVATAR);
          }
        } catch (e) {
          console.warn("Error fetching user profile from Firestore:", e);
          try { await currentUser.reload(); } catch {}
          setProfileName(currentUser.displayName || "User");
          setProfilePhoto(currentUser.photoURL || DEFAULT_AVATAR);
        }
      } else {
        setProfileName(null);
        setProfilePhoto(null);
        setSavedAddress(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const currentUser = userCredential.user;
    const defaultAvatar = DEFAULT_AVATAR;

    let sanitizedName = name.trim();
    if (sanitizedName.length > 50) {
      sanitizedName = sanitizedName.substring(0, 50);
    }
    sanitizedName = sanitizedName.replace(/<[^>]*>/g, "");
    if (!sanitizedName) {
      sanitizedName = "User";
    }

    // Save profile details to Auth Profile
    await updateProfile(currentUser, {
      displayName: sanitizedName,
      photoURL: defaultAvatar,
    });

    await currentUser.getIdToken(true);
    await new Promise(r => setTimeout(r, 300));

    // Save to Firestore users collection (non-fatal — auth already succeeded)
    try {
      let attempts = 0;
      while (attempts < 3) {
        try {
          await setDoc(doc(db, "users", currentUser.uid), {
            name: sanitizedName,
            email,
            photoURL: defaultAvatar,
            createdAt: serverTimestamp(),
          });
          break;
        } catch (e: any) {
          if (e?.code === "permission-denied" && attempts < 2) {
            attempts++;
            await new Promise(r => setTimeout(r, 500));
            await currentUser.getIdToken(true);
          } else throw e;
        }
      }
    } catch (firestoreErr) {
      console.warn("[signup] Firestore profile write failed (non-fatal):", firestoreErr);
    }

    setProfileName(sanitizedName);
    setProfilePhoto(defaultAvatar);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const forgotPassword = async (email: string) => {
    try {
      console.log("[forgotPassword] API hit for:", email);
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        throw new Error(data?.error || "API failed");
      }
    } catch (error: unknown) {
      console.error(`[Firebase Auth] Password reset request failed:`, error);
      throw error;
    }
  };

  const updateProfileName = async (newName: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No user is logged in");

    let sanitizedName = newName.trim();
    if (sanitizedName.length === 0) {
      throw new Error("Display name cannot be empty");
    }
    if (sanitizedName.length > 50) {
      sanitizedName = sanitizedName.substring(0, 50);
    }
    sanitizedName = sanitizedName.replace(/<[^>]*>/g, "");

    // Update Firebase Auth profile displayName
    await updateProfile(currentUser, {
      displayName: sanitizedName,
    });

    // Update Firestore users document name
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        name: sanitizedName,
      },
      { merge: true },
    );

    // Update local state
    setProfileName(sanitizedName);
  };

  const saveAddress = async (addr: { name: string; address: string; city: string; state: string; pinCode: string; phone: string }) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid), { savedAddress: addr });
    setSavedAddress(addr);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profileName,
        profilePhoto,
        loading,
        authModalOpen,
        setAuthModalOpen,
        login,
        signup,
        logout,
        forgotPassword,
        updateProfileName,
        savedAddress,
        saveAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
