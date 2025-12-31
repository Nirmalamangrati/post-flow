import React, { useEffect, useState } from "react";
import FriendRequest from "../friendrequest/FriendRequest";

interface Friend {
  _id: string;
  fullName: string;
  email: string;
  profilePic: string;
}

const API_BASE = "https://backend-of-postflow-fioq.vercel.app/api";

const FriendList: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const getToken = () => localStorage.getItem("token");

  // Fetch friends from backend
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
      if (data.length > 0) setSelectedFriendId(data[0]._id);
      else setSelectedFriendId("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Remove friend
  const removeFriend = async (friendId: string) => {
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");

      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("No userId found");

      const res = await fetch(`${API_BASE}/remove-friends/${friendId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove friend");
      }

      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      if (friendId === selectedFriendId) setSelectedFriendId("");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  // Filter friends for search
  const filteredFriends = friends.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log(filteredFriends);
  return (
    <div className="w-full max-w-3xl mx-auto mt-5 p-5 bg-gradient-to-br from-white to-gray-100 rounded-2xl shadow-[0px_5px_20px_rgba(0,0,0,0.15)] border border-gray-200">
      <nav className="bg-red-700 text-white w-full flex justify-between items-center px-6 py-3 shadow-md rounded-md">
        <ul className="flex space-x-6 text-white text-2xl font-bold">
          <li
            className="hover:text-gray-200 cursor-pointer w-full"
            onClick={() => setShowSuggestions(false)}
          >
            Your Friends
          </li>
          <li
            className="hover:text-gray-200 cursor-pointer"
            onClick={() => setShowSuggestions(true)}
          >
            Suggestions
          </li>
        </ul>
        <div>
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-1 rounded-full border border-gray-200 text-black focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </nav>

      <div className="p-4 bg-white rounded-xl shadow-md w-90 mx-auto mt-4 text-center">
        {!showSuggestions ? (
          <>
            {/* Friends list */}
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Your Friends
            </h3>

            {loading && <p className="text-blue-500">Loading friends...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && filteredFriends.length === 0 && (
              <p className="text-gray-500">No friends found.</p>
            )}

            <ul className="space-y-3 mt-4">
              {filteredFriends.map((friend) => (
                <li
                  key={friend._id}
                  onClick={() => setSelectedFriendId(friend._id)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 hover:shadow-sm transition"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={friend.profilePic || "/default.jpg"}
                      alt="profile"
                      className="w-12 h-12 rounded-full object-cover border shadow-sm"
                    />
                    <span className="font-semibold text-gray-800 text-[15px]">
                      {friend.fullName || friend.email}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFriend(friend._id);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md transition"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <FriendRequest userId={selectedFriendId} currentFriends={friends} />
          </>
        )}
      </div>
    </div>
  );
};

export default FriendList;
