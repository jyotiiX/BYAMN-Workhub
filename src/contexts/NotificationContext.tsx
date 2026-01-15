import React, { createContext, useContext, useEffect, useState } from 'react';
import { ref, get, push, set, query, orderByChild, limitToLast, onValue } from 'firebase/database';
import { getToken, onMessage } from 'firebase/messaging';
import { database, messaging } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  userId: string;
  type: 'campaign_update' | 'work_approval' | 'work_rejection' | 'wallet_transaction' | 'message';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  requestPermission: () => Promise<void>;
  sendNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Request notification permission and get FCM token
  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY_HERE' // You'll need to generate this from Firebase Console
        });

        if (token && user?.uid) {
          // Store FCM token in user's profile
          await set(ref(database, `fcmTokens/${user.uid}`), token);
          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive push notifications.',
          });
        }
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Push notifications are disabled.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications.',
        variant: 'destructive',
      });
    }
  };

  // Send notification to user
  const sendNotification = async (notificationData: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    if (!notificationData.userId) return;

    try {
      const notificationRef = push(ref(database, `notifications/${notificationData.userId}`));
      await set(notificationRef, {
        ...notificationData,
        id: notificationRef.key,
        read: false,
        createdAt: Date.now(),
      });

      // Get FCM token and send push notification
      const tokenSnap = await get(ref(database, `fcmTokens/${notificationData.userId}`));
      if (tokenSnap.exists()) {
        const fcmToken = tokenSnap.val();

        // Here you would typically call your backend to send the FCM message
        // For now, we'll just show a toast
        toast({
          title: notificationData.title,
          description: notificationData.message,
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    if (!user?.uid) return;

    try {
      await set(ref(database, `notifications/${user.uid}/${id}/read`), true);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.uid) return;

    try {
      const updates: { [key: string]: boolean } = {};
      notifications.forEach(notification => {
        if (!notification.read) {
          updates[`notifications/${user.uid}/${notification.id}/read`] = true;
        }
      });

      if (Object.keys(updates).length > 0) {
        await set(ref(database), updates);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Listen for notifications
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const notificationsRef = ref(database, `notifications/${user.uid}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notificationsArray: Notification[] = Object.values(data)
          .sort((a: any, b: any) => b.createdAt - a.createdAt);

        setNotifications(notificationsArray);
        setUnreadCount(notificationsArray.filter((n: Notification) => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);

      toast({
        title: payload.notification?.title || 'Notification',
        description: payload.notification?.body || '',
      });

      // Refresh notifications
      if (user?.uid) {
        const notificationsRef = ref(database, `notifications/${user.uid}`);
        onValue(notificationsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const notificationsArray: Notification[] = Object.values(data)
              .sort((a: any, b: any) => b.createdAt - a.createdAt);

            setNotifications(notificationsArray);
            setUnreadCount(notificationsArray.filter((n: Notification) => !n.read).length);
          }
        }, { onlyOnce: true });
      }
    });

    return () => unsubscribe();
  }, [user?.uid, toast]);

  // Request permission on login
  useEffect(() => {
    if (user && profile && 'Notification' in window) {
      // Only request if not already granted
      if (Notification.permission === 'default') {
        requestPermission();
      }
    }
  }, [user, profile]);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestPermission,
    sendNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
