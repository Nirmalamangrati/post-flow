// FriendList.tsx
import React, { useEffect, useState } from "react";
import FriendRequest from "../friendrequest/FriendRequest.tsx";

interface Friend {
  _id: string;
  name: string;
  email: string;
}

const API_BASE = "http://localhost:8000/api";

const FriendList: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token");

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

  const removeFriend = async (friendId: string) => {
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");
      const res = await fetch(`${API_BASE}/friends/${friendId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || "Failed to remove friend");
      }

      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      if (friendId === selectedFriendId) setSelectedFriendId("");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleNewFriendRequest = () => {
    fetchFriends();
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  return (
    <div className="p-2 bg-white ml-35 rounded-lg shadow-md w-80 mx-auto text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Friends</h3>

      <FriendRequest
        friendId={selectedFriendId}
        onRequestHandled={handleNewFriendRequest}
      />

      {loading && (
        <p className="text-blue-500 text-center">Loading friends...</p>
      )}
      {error && <p className="text-red-500 text-center">{error}</p>}
      {!loading && friends.length === 0 && (
        <p className="text-center text-gray-500">You have no friends yet.</p>
      )}

      <ul className="space-y-4">
        {friends.map((friend) => (
          <li
            key={friend._id}
            className="flex justify-between items-center bg-gray-100 p-3 rounded shadow-sm hover:shadow-md transition cursor-pointer"
            onClick={() => setSelectedFriendId(friend._id)}
          >
            <div>
              <p className="font-semibold text-gray-800">{friend.name}</p>
              <p className="text-sm text-gray-600">{friend.email}</p>
            </div>
            <button
              className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                removeFriend(friend._id);
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FriendList;
