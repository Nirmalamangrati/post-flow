import React, { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface Friend {
  _id: string;
  fullName: string;
  email: string;
  profilePic: string;
}

interface Message {
  _id: string;
  text: string;
  from: "me" | "them";
  time: string;
  isEdited?: boolean;
  editedAt?: string;
}

const API_BASE = "https://backend-of-postflow-fioq.vercel.app/api";
const socket: Socket = io("https://backend-of-postflow-fioq.vercel.app");

const ChatPopupContainer: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [openChats, setOpenChats] = useState<Friend[]>([]);
  const [messagesMap, setMessagesMap] = useState<{ [key: string]: Message[] }>(
    {}
  );
  const [inputMap, setInputMap] = useState<{ [key: string]: string }>({});
  const [editModeMap, setEditModeMap] = useState<{
    [key: string]: { editing: boolean; tempText: string };
  }>({});
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
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
        console.error("Error saving messages from storage:", err);
      }
    },
    [loggedInUserId]
  );

  // Toggle menu
  const toggleMenu = (messageId: string) => {
    setMenuOpen(menuOpen === messageId ? null : messageId);
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ FIXED: Delete message - Check valid ID first
  const handleDeleteMessage = async (friendId: string, messageId: string) => {
    // Block temp/numeric IDs
    if (messageId.startsWith("temp_") || /^\d+$/.test(messageId)) {
      console.log("❌ Cannot delete temp message:", messageId);
      setMenuOpen(null);
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete message");

      setMessagesMap((prev) => {
        const updated = {
          ...prev,
          [friendId]:
            prev[friendId]?.filter((msg) => msg._id !== messageId) || [],
        };
        saveMessagesToStorage(updated);
        return updated;
      });
    } catch (err) {
      console.error("Delete error:", err);
    }
    setMenuOpen(null);
  };

  // ✅ FIXED: Edit message - Check valid ID first
  const handleEditMessage = async (
    friendId: string,
    messageId: string,
    newText: string
  ) => {
    // Block temp/numeric IDs
    if (messageId.startsWith("temp_") || /^\d+$/.test(messageId)) {
      console.log("❌ Cannot edit temp message:", messageId);
      setMenuOpen(null);
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/messages/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newText }),
      });

      if (!res.ok) throw new Error("Failed to edit message");

      const updatedMsg = await res.json();

      setMessagesMap((prev) => {
        const updated = {
          ...prev,
          [friendId]:
            prev[friendId]?.map((msg) =>
              msg._id === messageId
                ? {
                    ...msg,
                    text: updatedMsg.text,
                    isEdited: true,
                    editedAt: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  }
                : msg
            ) || [],
        };
        saveMessagesToStorage(updated);
        return updated;
      });

      setEditModeMap((prev) => ({
        ...prev,
        [messageId]: { editing: false, tempText: "" },
      }));
    } catch (err) {
      console.error("Edit error:", err);
    }
    setMenuOpen(null);
  };

  // Toggle edit mode
  const toggleEditMode = (
    friendId: string,
    messageId: string,
    currentText: string
  ) => {
    // Block temp IDs from edit mode
    if (messageId.startsWith("temp_") || /^\d+$/.test(messageId)) {
      console.log("❌ Cannot edit temp message");
      return;
    }

    setEditModeMap((prev) => ({
      ...prev,
      [messageId]: { editing: true, tempText: currentText },
    }));
    setMenuOpen(null);
  };

  // ✅ FIXED: handleSend with SERVER API CALL
  const handleSend = async (friendId: string) => {
    const text = inputMap[friendId]?.trim();
    if (!text) return;

    const tempId = `temp_${Date.now()}`;

    // 1. Optimistic UI - show temp message
    const tempMsg: Message = {
      _id: tempId,
      text,
      from: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessagesMap((prev) => {
      const updated = {
        ...prev,
        [friendId]: [...(prev[friendId] || []), tempMsg],
      };
      saveMessagesToStorage(updated);
      return updated;
    });

    setInputMap((prev) => ({ ...prev, [friendId]: "" }));

    try {
      // 2. Send to SERVER API
      const token = getToken();
      const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: friendId, text }),
      });

      if (!res.ok) throw new Error("Server error");

      const serverMsg = await res.json();
      console.log("✅ SERVER ID:", serverMsg._id);

      // 3. Replace temp ID with real server ID
      setMessagesMap((prev) => {
        const updated = { ...prev };
        if (updated[friendId]) {
          updated[friendId] = updated[friendId].map((msg) =>
            msg._id === tempId
              ? {
                  _id: serverMsg._id,
                  text: serverMsg.text,
                  from: "me",
                  time: new Date(serverMsg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }
              : msg
          );
        }
        saveMessagesToStorage(updated);
        return updated;
      });

      // 4. Socket emit for real-time
      socket.emit("message", { to: friendId, from: loggedInUserId, text });
    } catch (error) {
      console.error("❌ Send failed:", error);
      // Rollback temp message on error
      setMessagesMap((prev) => {
        const updated = { ...prev };
        if (updated[friendId]) {
          updated[friendId] = updated[friendId].filter(
            (msg) => msg._id !== tempId
          );
        }
        saveMessagesToStorage(updated);
        return updated;
      });
    }

    setTimeout(() => {
      messagesEndRefs.current[friendId]?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Receive message handler
  const handleReceiveMessage = useCallback(
    (msg: any) => {
      console.log("🎉 RECEIVED:", msg);
      const friendId = msg.from === loggedInUserId ? msg.to : msg.from;

      const newMsg: Message = {
        _id: msg._id || String(Date.now()),
        text: msg.text,
        from: msg.from === loggedInUserId ? "me" : "them",
        time: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        ...(msg.isEdited && { isEdited: true, editedAt: msg.editedAt }),
      };

      setMessagesMap((prev) => {
        const updated = {
          ...prev,
          [friendId]: [...(prev[friendId] || []), newMsg],
        };
        saveMessagesToStorage(updated);
        return updated;
      });
    },
    [loggedInUserId, saveMessagesToStorage]
  );

  // Socket listeners
  useEffect(() => {
    console.log("🔌 Socket connecting...");
    if (loggedInUserId) {
      socket.emit("join", loggedInUserId);
      console.log("joined room:", loggedInUserId);
    }

    socket.on("connect", () => console.log("✅ SOCKET CONNECTED"));
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("connect");
      socket.off("receiveMessage");
    };
  }, [loggedInUserId, handleReceiveMessage]);

  // Initial load
  useEffect(() => {
    fetchFriends();
    loadMessagesFromStorage();
  }, [loadMessagesFromStorage]);

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
    if (existingMessages?.length > 0) return;

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

      if (!res.ok) return;

      const data = await res.json();
      const mapped: Message[] = data.map((m: any) => ({
        _id: m._id,
        text: m.text,
        from: m.from === loggedInUserId ? "me" : "them",
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        ...(m.isEdited && { isEdited: true, editedAt: m.editedAt }),
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

  // Auto-save
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Object.keys(messagesMap).length > 0)
        saveMessagesToStorage(messagesMap);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [messagesMap, saveMessagesToStorage]);

  const filteredFriends = friends.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full relative">
      {/* Friend List */}
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
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 h-60 relative">
            {isLoadingMessages[friend._id] ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Loading...
              </div>
            ) : (
              <>
                {(messagesMap[friend._id] || []).map((m) => {
                  const editMode = editModeMap[m._id];
                  const isMenuOpen = menuOpen === m._id;
                  return (
                    <div
                      key={m._id}
                      className={`flex ${
                        m.from === "me" ? "justify-end" : "justify-start"
                      } mb-2`}
                    >
                      <div className="flex flex-col items-end">
                        {editMode?.editing ? (
                          <div className="flex gap-1 w-full">
                            <input
                              type="text"
                              value={editMode.tempText}
                              onChange={(e) =>
                                setEditModeMap((prev) => ({
                                  ...prev,
                                  [m._id!]: {
                                    ...prev[m._id!],
                                    tempText: e.target.value,
                                  },
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleEditMessage(
                                    friend._id,
                                    m._id!,
                                    editMode.tempText
                                  );
                                else if (e.key === "Escape")
                                  setEditModeMap((prev) => ({
                                    ...prev,
                                    [m._id!]: undefined,
                                  }));
                              }}
                              className="flex-1 px-3 py-2 rounded-2xl bg-indigo-600 text-white text-[13px] outline-none"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  handleEditMessage(
                                    friend._id,
                                    m._id!,
                                    editMode.tempText
                                  )
                                }
                                className="text-xs text-blue-200 hover:text-blue-400 p-1"
                                title="Save (Enter)"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() =>
                                  setEditModeMap((prev) => ({
                                    ...prev,
                                    [m._id!]: undefined,
                                  }))
                                }
                                className="text-xs text-gray-400 hover:text-gray-200 p-1"
                                title="Cancel (Escape)"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-end gap-2 w-full">
                              <div
                                className={`flex-1 px-3 py-2 rounded-2xl ${
                                  m.from === "me"
                                    ? "bg-indigo-600 text-white rounded-br-sm"
                                    : "bg-[#15171c] text-gray-100 rounded-bl-sm"
                                }`}
                              >
                                <p className="text-[13px]">{m.text}</p>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="block text-[10px] text-gray-400">
                                    {m.time}
                                    {m.isEdited && (
                                      <span className="ml-1 text-[8px]">
                                        (edited)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* ✅ FIXED: 3 dots ONLY for valid server IDs */}
                              {m.from === "me" &&
                                !m._id.startsWith("temp_") &&
                                !/^\d+$/.test(m._id) && (
                                  <div className="relative">
                                    <button
                                      className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-all text-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMenu(m._id);
                                      }}
                                      title="More options"
                                    >
                                      ⋮⋮⋮
                                    </button>
                                    {isMenuOpen && (
                                      <div className="absolute top-6 right-0 bg-[#15171c] rounded-lg shadow-lg py-1 border border-gray-700 w-24 z-20">
                                        <button
                                          onClick={() =>
                                            toggleEditMode(
                                              friend._id,
                                              m._id!,
                                              m.text
                                            )
                                          }
                                          className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2"
                                        >
                                          <span className="text-blue-400">
                                            ✏️
                                          </span>
                                          Edit
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteMessage(
                                              friend._id,
                                              m._id!
                                            )
                                          }
                                          className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2"
                                        >
                                          <span className="text-red-400">
                                            🗑️
                                          </span>
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
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
