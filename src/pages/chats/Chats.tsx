import React, { useEffect, useState, useRef } from "react";
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
  const messagesEndRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const loggedInUserId = localStorage.getItem("userId") || "";
  const getToken = () => localStorage.getItem("token");

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

  useEffect(() => {
    fetchFriends();
  }, []);

  // Socket listener
  useEffect(() => {
    socket.on("receiveMessage", (msg: any) => {
      const key = msg.from === loggedInUserId ? msg.to : msg.from;
      setMessagesMap((prev) => ({
        ...prev,
        [key]: [
          ...(prev[key] || []),
          { ...msg, from: msg.from === loggedInUserId ? "me" : "them" },
        ],
      }));
    });

    return () => socket.off("receiveMessage");
  }, []);

  const openChat = async (friend: Friend) => {
    if (!openChats.find((f) => f._id === friend._id)) {
      setOpenChats((prev) => [...prev, friend]);
    }

    // Load previous messages
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(
        `${API_BASE}/messages/${friend._id}?userId=${loggedInUserId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
      }));

      setMessagesMap((prev) => ({ ...prev, [friend._id]: mapped }));
    } catch (e) {
      console.error(e);
    }
  };

  const closeChat = (friendId: string) => {
    setOpenChats((prev) => prev.filter((f) => f._id !== friendId));
  };

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

    setMessagesMap((prev) => ({
      ...prev,
      [friendId]: [...(prev[friendId] || []), msg],
    }));

    setInputMap((prev) => ({ ...prev, [friendId]: "" }));

    socket.emit("sendMessage", { to: friendId, from: loggedInUserId, text });

    setTimeout(() => {
      messagesEndRefs.current[friendId]?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // Filtered friends
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
          className="absolute w-72 bg-gradient-to-b from-black  via-[#3a0000] to-[#a30000] rounded-lg shadow-lg flex flex-col"
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
