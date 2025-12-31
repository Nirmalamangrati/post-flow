// src/components/NotificationBell.tsx
import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface Notification {
  type: "new_message" | "new_post";
  fromUser: {
    id: string;
    fullName: string;
    profilePic: string;
  };
  message: string;
  chatId?: string;
  postId?: string;
  time: string;
}

interface NotificationBellProps {
  userId: string;
  socket: Socket;
  onChatOpen: (friendId: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  userId,
  socket,
  onChatOpen,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  // Socket notification listener
  useEffect(() => {
    const handleNotification = (notif: any) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 9)]); // Max 10
      setShowPopup(true);

      // Sound effect
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAo"
      );
      audio.volume = 0.3;
      audio.play().catch(() => {});
    };

    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, [socket]);

  const clearAll = () => setNotifications([]);

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowPopup(!showPopup)}
        className={`p-2 rounded-full transition-all relative ${
          notifications.length > 0
            ? "bg-red-500 text-white shadow-lg animate-pulse"
            : "text-gray-400 hover:text-white hover:bg-gray-800"
        }`}
        title="Notifications"
      >
        🔔
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </button>

      {/* Notification Popup */}
      {showPopup && (
        <div className="absolute top-12 right-0 w-96 bg-gradient-to-b from-gray-900 via-black to-[#1a0000] rounded-2xl shadow-2xl border border-gray-800 z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-5 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900/50 backdrop-blur-sm rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-400 rounded-full animate-ping"></div>
              <h3 className="text-white font-bold text-xl">Notifications</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => clearAll()}
                className="text-gray-400 hover:text-gray-200 px-3 py-1 text-sm rounded-lg hover:bg-gray-800 transition-all"
                disabled={notifications.length === 0}
              >
                Clear All
              </button>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-400 hover:text-white text-xl p-1 rounded-lg hover:bg-gray-800"
              >
                ×
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  ✨
                </div>
                <p className="text-gray-400 text-lg font-medium">
                  No new notifications
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Everything is up to date
                </p>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div
                  key={idx}
                  className="p-5 border-b border-gray-800 last:border-b-0 hover:bg-gray-900/50 transition-all cursor-pointer group"
                  onClick={() => {
                    if (notif.chatId) {
                      onChatOpen(notif.chatId);
                    }
                    setShowPopup(false);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={notif.fromUser.profilePic || "/default.jpg"}
                      className="w-12 h-12 rounded-full ring-2 ring-blue-500/30 flex-shrink-0"
                      alt={notif.fromUser.fullName}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-semibold text-lg truncate group-hover:text-blue-400 transition-colors">
                          {notif.fromUser.fullName}
                        </h4>
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-gray-300 text-base mb-3 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {notif.type === "new_message" && (
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                            💬 New Message
                          </span>
                        )}
                        {notif.type === "new_post" && (
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                            📱 New Post
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showPopup && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
