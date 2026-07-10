import { useEffect, useState } from "react";
import { getToken } from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase";
import { saveFcmToken } from "@/services/dreamService";
import { useAuth } from "@/hooks/useAuth";
import { isLinkedAuthUser } from "@/lib/authUser";

export function usePushNotifications() {
  const { user } = useAuth();
  const isMember = isLinkedAuthUser(user);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!user || !isMember) return false;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("VAPID key not configured");
      return false;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return false;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== "granted") return false;

    try {
      const fcmToken = await getToken(messaging, { vapidKey });
      setToken(fcmToken);
      await saveFcmToken(user.uid, fcmToken);
      return true;
    } catch (err) {
      console.error("FCM token error:", err);
      return false;
    }
  };

  return { permission, token, requestPermission };
}
