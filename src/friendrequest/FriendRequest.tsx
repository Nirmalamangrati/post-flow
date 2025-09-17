import React, { useEffect, useState } from "react";

interface FriendRequestProps {
  friendId: string;
}

interface User {
  _id: string;
  name: string;
}

const API_BASE = "http://localhost:8000/api";

const FriendRequest: React.FC<FriendRequestProps> = ({ friendId }) => {
  const [message, setMessage] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token");

  // Fetch selected user full name
  const fetchUser = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/users/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setFullName(data.fullname || "No Name");
    } catch {
      setFullName("Unknown User");
    }
  };

  // Fetch all users
  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${API_BASE}/friends/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        console.log("All users fetched:", data);
        throw new Error(data.msg || "Failed to fetch all users");
      }

      const data: User[] = await res.json();
      setAllUsers(data);
    } catch (err: any) {
      setErrorUsers(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (friendId) {
      fetchUser();
    }
    fetchAllUsers();
  }, [friendId]);

  // Send friend request
  const sendRequestTo = async (friendId: string) => {
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${API_BASE}/friends/request/${friendId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to send request");

      setMessage(data.msg);
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  // Remove user
  const removeUserById = async (userId: string) => {
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${API_BASE}/friends/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to remove user");

      setMessage(data.msg);
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div className="p-4 bg-white ml-200 rounded-lg shadow-md w-100 mx-auto text-center px-4 py-2">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        People you may know
      </h3>

      {/* Display selected user full name */}
      <span>{fullName}</span>

      {/* Message alert */}
      {message && (
        <p className="text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded border border-gray-300">
          {message}
        </p>
      )}

      {/* All users list */}
      {loadingUsers && <p>Loading users...</p>}
      {errorUsers && <p className="text-red-500">{errorUsers}</p>}

      {!loadingUsers && !errorUsers && allUsers.length > 0 && (
        <ul className="text-left max-h-48 overflow-auto p-2 rounded">
          {allUsers.map((user) => (
            <li
              key={user._id}
              className="py-2 flex justify-between items-center"
            >
              <p className="font-medium">{user.name}</p>

              <div className="space-x-1">
                <button
                  onClick={() => sendRequestTo(user._id)}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
                >
                  Send
                </button>
                <button
                  onClick={() => removeUserById(user._id)}
                  className="bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendRequest;
