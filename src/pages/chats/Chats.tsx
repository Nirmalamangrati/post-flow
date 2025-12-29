import React, { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface Friend {
  _id: string;
  fullName: string;
  email: string;
  profilePic: string;
}

interface Message {
  _id?: string;
  text: string;
  from: "me" | "them";
  time: string;
}

const API_BASE = "http://localhost:8000/api";
const socket: Socket = io("http://localhost:8000");

const ChatPopupContainer: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [openChats, setOpenChats] = useState<Friend[]>([]);
  const [messagesMap, setMessagesMap] = useState<{ [key: string]: Message[] }>(
    {}
  );
  const [inputMap, setInputMap] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState<{
    [key: string]: boolean;
  }>({});
  const messagesEndRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const loggedInUserId = localStorage.getItem("userId") || "";
  const getToken = () => localStorage.getItem("token");

  // Load messages from localStorage
  const loadMessagesFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(`chatMessages_${loggedInUserId}`);
      if (saved) {
        const parsed = JSON.parse(saved) as { [key: string]: Message[] };
        setMessagesMap(parsed);
      }
    } catch (err) {
      console.error("Error loading messages from storage:", err);
    }
  }, [loggedInUserId]);

  // Save messages to localStorage
  const saveMessagesToStorage = useCallback(
    (updatedMap: { [key: string]: Message[] }) => {
      try {
        localStorage.setItem(
          `chatMessages_${loggedInUserId}`,
          JSON.stringify(updatedMap)
        );
      } catch (err) {
        console.error("Error saving messages to storage:", err);
      }
    },
    [loggedInUserId]
  );

  //Receive message handler
  const handleReceiveMessage = useCallback(
    (msg: any) => {
      console.log("🎉 RECEIVED raw message:", msg);
      const friendId = msg.from === loggedInUserId ? msg.to : msg.from;

      const newMsg: Message = {
        _id: msg._id || String(Date.now()),
        text: msg.text,
        from: msg.from === loggedInUserId ? "me" : "them",
        time: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      console.log("Processed message:", { friendId, newMsg });

      setMessagesMap((prev) => {
        const updated = {
          ...prev,
          [friendId]: [...(prev[friendId] || []), newMsg],
        };
        saveMessagesToStorage(updated);

        // AUTO SCROLL to bottom
        setTimeout(() => {
          messagesEndRefs.current[friendId]?.scrollIntoView({
            behavior: "smooth",
          });
        }, 100);

        return updated;
      });
    },
    [loggedInUserId, saveMessagesToStorage]
  );

  //  Socket connection + listeners
  useEffect(() => {
    console.log("🔌 Socket connecting...");

    if (loggedInUserId) {
      socket.emit("join", loggedInUserId);
      console.log("joined socket room:", loggedInUserId);
    }

    socket.on("connect", () => {
      console.log(" SOCKET CONNECTED");
    });

    socket.on("disconnect", () => {
      console.log("❌ SOCKET DISCONNECTED");
    });

    // Listen for receiveMessage
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("receiveMessage");
    };
  }, [loggedInUserId, handleReceiveMessage]);

  // Fetch friends + load storage
  useEffect(() => {
    fetchFriends();
    loadMessagesFromStorage();
  }, [loadMessagesFromStorage]);

  // Fetch friends
  const fetchFriends = async () => {
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${API_BASE}/friends/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch friends");

      const data: Friend[] = await res.json();
      setFriends(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openChat = async (friend: Friend) => {
    if (!openChats.find((f) => f._id === friend._id)) {
      setOpenChats((prev) => [...prev, friend]);
    }

    const existingMessages = messagesMap[friend._id];
    if (existingMessages && existingMessages.length > 0) {
      setTimeout(() => {
        messagesEndRefs.current[friend._id]?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
      return;
    }

    setIsLoadingMessages((prev) => ({ ...prev, [friend._id]: true }));

    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/messages/${friend._id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch messages:", res.status);
        return;
      }

      const data = await res.json();
      const mapped: Message[] = data.map((m: any) => ({
        _id: m._id,
        text: m.text,
        from: m.from === loggedInUserId ? "me" : "them",
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      setMessagesMap((prev) => {
        const updated = { ...prev, [friend._id]: mapped };
        saveMessagesToStorage(updated);
        return updated;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMessages((prev) => ({ ...prev, [friend._id]: false }));
    }
  };

  const closeChat = (friendId: string) => {
    setOpenChats((prev) => prev.filter((f) => f._id !== friendId));
  };

  //send message handler
  const handleSend = (friendId: string) => {
    const text = inputMap[friendId]?.trim();
    if (!text) return;

    const msg: Message = {
      _id: String(Date.now()),
      text,
      from: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Optimistic update (shows immediately in sender UI)
    setMessagesMap((prev) => {
      const updated = {
        ...prev,
        [friendId]: [...(prev[friendId] || []), msg],
      };
      saveMessagesToStorage(updated);
      return updated;
    });

    setInputMap((prev) => ({ ...prev, [friendId]: "" }));

    // Emit via socket
    socket.emit("message", { to: friendId, from: loggedInUserId, text });
    console.log("Sent message via socket:", {
      to: friendId,
      from: loggedInUserId,
      text,
    });

    setTimeout(() => {
      messagesEndRefs.current[friendId]?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // Auto-save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Object.keys(messagesMap).length > 0) {
        saveMessagesToStorage(messagesMap);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [messagesMap, saveMessagesToStorage]);

  const filteredFriends = friends.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full relative">
      {/* Left: Friend List */}
      <div className="w-80 flex flex-col bg-gradient-to-b from-black via-[#3a0000] to-[#a30000] p-4">
        <div className="flex items-center gap-2 mb-4 bg-[#1f1f1f] p-2 rounded-md">
          <input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#2a2a2a]"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredFriends.length === 0 && (
            <p className="text-gray-400 text-center">No friends found.</p>
          )}

          {filteredFriends.map((friend) => (
            <div
              key={friend._id}
              className="flex items-center justify-between p-3 bg-[#15171c] rounded-xl cursor-pointer hover:bg-gray-700 transition"
            >
              <div
                className="flex items-center gap-3 flex-1"
                onClick={() => openChat(friend)}
              >
                <img
                  src={friend.profilePic || "/default.jpg"}
                  alt={friend.fullName}
                  className="w-12 h-12 rounded-full object-cover border border-gray-600"
                />
                <span className="text-white font-semibold">
                  {friend.fullName}
                </span>
              </div>
              <div
                className="text-gray-400 text-lg cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  openChat(friend);
                }}
              >
                💬
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Popups */}
      {openChats.map((friend, idx) => (
        <div
          key={friend._id}
          className="absolute w-72 bg-gradient-to-b from-black via-[#3a0000] to-[#a30000] rounded-lg shadow-lg flex flex-col"
          style={{ right: `${0.01 + idx * 5}px`, top: "79px", zIndex: 50 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <img
                src={friend.profilePic || "/default.jpg"}
                className="w-8 h-8 rounded-full"
              />
              <p className="text-white font-semibold text-sm">
                {friend.fullName}
              </p>
            </div>
            <button
              className="text-white font-bold cursor-pointer hover:text-red-500"
              onClick={() => closeChat(friend._id)}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 h-60">
            {isLoadingMessages[friend._id] ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Loading messages...
              </div>
            ) : (
              <>
                {(messagesMap[friend._id] || []).map((m) => (
                  <div
                    key={m._id}
                    className={`flex ${
                      m.from === "me" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-2xl ${
                        m.from === "me"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-[#15171c] text-gray-100 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-[13px]">{m.text}</p>
                      <span className="block text-[10px] text-gray-400 text-right mt-1">
                        {m.time}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={(el) => (messagesEndRefs.current[friend._id] = el)} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center px-3 py-2 border-t border-gray-800 gap-2">
            <input
              type="text"
              className="flex-1 h-8 px-3 rounded-full bg-[#15171c] text-white outline-none text-sm"
              placeholder="Message..."
              value={inputMap[friend._id] || ""}
              onChange={(e) =>
                setInputMap((prev) => ({
                  ...prev,
                  [friend._id]: e.target.value,
                }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSend(friend._id)}
            />
            <button
              className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold hover:bg-indigo-500"
              onClick={() => handleSend(friend._id)}
            >
              ➤
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatPopupContainer;
