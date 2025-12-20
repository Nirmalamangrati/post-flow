// ChatWindow.tsx
import { useState } from "react";

type Message = {
  id: number;
  text: string;
  from: "me" | "them";
  time: string;
};

const initialMessages: Message[] = [
  { id: 1, text: "Hey Julie, how are you?", from: "me", time: "09:24" },
  { id: 2, text: "Hi! I’m good, what about you?", from: "them", time: "09:25" },
  { id: 3, text: "Working on a new project UI 😄", from: "me", time: "09:26" },
];

export default function ChatWindow() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newMsg: Message = {
      id: Date.now(),
      text: input.trim(),
      from: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[#050608]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-sm font-semibold">
          J
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Julie Mendez</p>
          <p className="text-[11px] text-gray-400">Active now</p>
        </div>
        <button className="text-gray-400 hover:text-white text-xl">⋮</button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.from === "me" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-3 py-2 text-[13px] leading-snug
                ${
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

      {/* Input area */}
      <div className="px-3 py-3 border-t border-gray-800 flex items-center gap-2">
        <button className="w-9 h-9 rounded-full bg-[#15171c] flex items-center justify-center text-lg text-gray-300">
          +
        </button>

        <div className="flex-1 flex items-center bg-[#15171c] rounded-full px-3">
          <input
            className="flex-1 bg-transparent outline-none text-sm text-gray-100 placeholder:text-gray-500"
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
    </div>
  );
}
