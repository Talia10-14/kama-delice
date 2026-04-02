'use client';

import { useEffect, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: string;
  message: string;
  date: Date;
  read: boolean;
  link?: string;
}

/**
 * Hook pour gérer les notifications en temps réel via SSE
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Se connecter au flux SSE
  useEffect(() => {
    const connect = () => {
      try {
        const es = new EventSource('/api/notifications/stream');

        es.addEventListener('connected', () => {
          setIsConnected(true);
        });

        es.addEventListener('notifications_batch', (event: any) => {
          try {
            const data = JSON.parse(event.data);
            if (data.notifications) {
              setNotifications(
                data.notifications.map((n: any) => ({
                  ...n,
                  date: new Date(n.date),
                }))
              );
              updateUnreadCount(data.notifications);
            }
          } catch (error) {
            console.error('Erreur lors du parsing des notifications:', error);
          }
        });

        es.addEventListener('ping', () => {
          // Garder la connexion active
        });

        es.onerror = () => {
          setIsConnected(false);
          es.close();
          // Reconnecter après 5 secondes
          setTimeout(connect, 5000);
        };

        setEventSource(es);
      } catch (error) {
        console.error('Erreur lors de la connexion au flux SSE:', error);
        setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Mettre à jour le compte de non-lus
  const updateUnreadCount = useCallback((notifs: Notification[]) => {
    const count = notifs.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    updateUnreadCount(notifications);
  }, [notifications, updateUnreadCount]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Ajouter une notification (appelée par d'autres composants si nécessaire)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    addNotification,
  };
}
