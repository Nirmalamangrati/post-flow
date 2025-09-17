import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface NotificationData {
  message: string;
  postId?: string;
  timestamp: string | Date;
}

interface NotificationProps {
  userId: string;
}

const socket: Socket = io("http://localhost:8000");

const Notification: React.FC<NotificationProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (!userId) return;

    // User specific room join
    socket.emit("joinRoom", userId);

    // Listen for new notifications
    socket.on("newNotification", (data: NotificationData) => {
      setNotifications((prev) => [data, ...prev]);
    });

    // Cleanup on unmount
    return () => {
      socket.off("newNotification");
    };
  }, [userId]);

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "auto" }}>
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul>
          {notifications.map((notif, i) => (
            <li key={i}>
              <strong>{notif.message}</strong>
              <br />
              <small>{new Date(notif.timestamp).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notification;
