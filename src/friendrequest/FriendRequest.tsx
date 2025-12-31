import React, { useEffect, useState } from "react";

interface FriendRequestProps {
  userId: string;
  currentFriends: { _id: string }[];
}

interface User {
  _id: string;
  name: string;
}

const API_BASE = "https://backend-of-postflow-fioq.vercel.app/api";

const FriendRequest: React.FC<FriendRequestProps> = ({ currentFriends }) => {
  const [message, setMessage] = useState<string>("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token");

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
    fetchAllUsers();
  }, []);

  // Filter users, exclude current friends
  const filteredUsers = allUsers.filter(
    (user) => !currentFriends.some((f) => f._id === user._id)
  );

  // Send friend request
  const sendRequestTo = async (userId: string) => {
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${API_BASE}/friends/request/${userId}`, {
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

      const res = await fetch(`${API_BASE}/friends/removes/${userId}`, {
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
    <div className="text-center w-full ">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        People you may know
      </h3>

      {message && (
        <p className="text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded border border-gray-300 mb-2">
          {message}
        </p>
      )}

      {loadingUsers && <p>Loading users...</p>}
      {errorUsers && <p className="text-red-500">{errorUsers}</p>}

      {!loadingUsers && !errorUsers && filteredUsers.length > 0 && (
        <ul className="text-left max-h-48 overflow-auto p-2 rounded">
          {filteredUsers.map((user) => (
            <li
              key={user._id}
              className="py-2 flex justify-between items-center"
            >
              <p className="font-medium">{user.name}</p>

              <div className="space-x-1">
                <button
                  onClick={() => sendRequestTo(user._id)}
                  className="bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
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

      {!loadingUsers && filteredUsers.length === 0 && (
        <p className="text-gray-500">No suggestions available.</p>
      )}
    </div>
  );
};

export default FriendRequest;
