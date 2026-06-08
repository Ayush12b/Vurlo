import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "order" | "system" | "alert";
  read: boolean;
  timestamp: any;
  link: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (
    message: string,
    type: "order" | "system" | "alert",
    link: string,
    targetUserId?: string
  ) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(25)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Notification[] = [];
        snapshot.forEach((d) => {
          list.push({
            id: d.id,
            ...d.data(),
          } as Notification);
        });
        setNotifications(list);
      },
      (error) => {
        console.error("Notifications listener error:", error);
        // If index missing, error.code === "failed-precondition" — check Firebase Console > Indexes
        setNotifications([]);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "notifications", notificationId);
      await updateDoc(docRef, { read: true });
    } catch (e) {
      console.error("Error marking notification as read:", e);
    }
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const unreadList = notifications.filter((n) => !n.read);
      if (unreadList.length === 0) return;

      const batch = writeBatch(db);
      unreadList.forEach((n) => {
        const docRef = doc(db, "notifications", n.id);
        batch.update(docRef, { read: true });
      });
      await batch.commit();
    } catch (e) {
      console.error("Error marking all notifications as read:", e);
    }
  };

  const addNotification = async (
    message: string,
    type: "order" | "system" | "alert",
    link: string,
    targetUserId?: string
  ) => {
    const uid = targetUserId || user?.uid;
    if (!uid) return;
    try {
      await addDoc(collection(db, "notifications"), {
        userId: uid,
        message,
        type,
        read: false,
        timestamp: serverTimestamp(),
        link,
      });
    } catch (e) {
      console.error("Error adding notification:", e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
