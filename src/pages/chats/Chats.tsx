import React, { useEffect, useState } from "react";

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

const ChatContainer: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: yo id timro auth system bata linu (decode token etc.)
  const loggedInUserId = localStorage.getItem("userId") || "";

  const getToken = () => localStorage.getItem("token");

  // Fetch friends
  const fetchFriends = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${API_BASE}/friends/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || "Failed to fetch friends");
      }

      const data: Friend[] = await res.json();
      setFriends(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  // Filter friends
  const filteredFriends = friends.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch messages of selected friend
  const loadMessages = async (friend: Friend) => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/messages/${friend._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("Failed to fetch messages");
        return;
      }

      const data = await res.json(); // array from backend
      const mapped: Message[] = data.map((m: any) => ({
        _id: m._id,
        text: m.text,
        from: m.from === loggedInUserId ? "me" : "them",
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setMessages(mapped);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle sending message
  const handleSend = async () => {
    if (!input.trim() || !selectedFriend) return;

    const text = input.trim();
    setInput("");

    const tempId = String(Date.now());

    // optimistic UI
    const tempMsg: Message = {
      _id: tempId,
      text,
      from: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: selectedFriend._id,
          text,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const saved = await res.json(); // {_id, text, from, to, createdAt}

      // replace temp msg with real data
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempId
            ? {
                ...m,
                _id: saved._id,
                time: new Date(saved.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : m
        )
      );
    } catch (err) {
      console.error(err);
      // optional: rollback, show error toast
    }
  };

  return (
    <div className="flex h-full">
      {/* Left: Friend List */}
      <div className="w-80 flex flex-col bg-gradient-to-b from-black via-[#3a0000] to-[#a30000] p-4">
        {/* Search */}
        <div className="flex items-center gap-2 mb-4 bg-[#1f1f1f] p-2 rounded-md">
          <input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#2a2a2a]"
          />
          <button
            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-700"
            onClick={() => {}}
          >
            🔍
          </button>
        </div>

        {/* Friend List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading && (
            <p className="text-blue-400 text-center">Loading friends...</p>
          )}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {!loading && filteredFriends.length === 0 && (
            <p className="text-gray-400 text-center">No friends found.</p>
          )}

          {filteredFriends.map((friend) => (
            <div
              key={friend._id}
              className="flex items-center justify-between p-3 bg-[#15171c] rounded-xl cursor-pointer hover:bg-gray-700 transition"
            >
              <div
                className="flex items-center gap-3 flex-1"
                onClick={() => {
                  setSelectedFriend(friend);
                  loadMessages(friend);
                }}
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
                onClick={() => {
                  setSelectedFriend(friend);
                  loadMessages(friend);
                }}
              >
                💬
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Chat Window */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-black via-[#3a0000] to-[#a30000]">
        {!selectedFriend ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
            Select a friend to start chatting
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
              <img
                src={selectedFriend.profilePic || "/default.jpg"}
                alt={selectedFriend.fullName}
                className="w-9 h-9 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-white font-semibold">
                  {selectedFriend.fullName}
                </p>
                <p className="text-[11px] text-gray-400">Active now</p>
              </div>
              <div className="text-gray-400 text-xl">💬</div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 text-sm">
              {messages.map((m) => (
                <div
                  key={m._id}
                  className={`flex ${
                    m.from === "me" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                      m.from === "me"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-[#15171c] text-gray-100 rounded-bl-sm"
                    }`}
                  >
                    <p>{m.text}</p>
                    <span className="block mt-1 text-[10px] text-gray-400 text-right">
                      {m.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-gray-800 flex items-center gap-2">
              <div className="flex-1 flex items-center bg-[#15171c] rounded-full px-3">
                <input
                  className="flex-1 h-8 bg-transparent outline-none text-sm text-gray-100 placeholder:text-gray-500"
                  placeholder="Message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
              </div>
              <button
                onClick={handleSend}
                className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold hover:bg-indigo-500"
              >
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;
