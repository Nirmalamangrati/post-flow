import React, { useState } from "react";

const Setting = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }

    const token = localStorage.getItem("token");

    // ✅ ✅ THIS IS THE MISSING PROTECTION
    if (!token) {
      setMessage("Session expired. Please login again.");
      return;
    }

    try {
      const response = await fetch(
        "https://backend-of-postflow-fioq.vercel.app/api/users/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong.");
      } else {
        setMessage(data.message || "Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);
      setMessage("Server error. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-10 bg-black-100 rounded-xl shadow-lg space-y-6">
      <h2 className="text-3xl font-extrabold text-red-600 text-center animate-pulse">
        Change Password
      </h2>

      <form onSubmit={handleChangePassword} className="space-y-5">
        <input
          type="password"
          className="w-full px-4 py-3 rounded-md bg-gray-300 text-red-400 placeholder-white focus:outline-none focus:ring-2 focus:ring-red-600"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <input
          type="password"
          className="w-full px-4 py-3 rounded-md bg-gray-300 text-red-400 placeholder-white focus:outline-none focus:ring-2 focus:ring-red-600"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <input
          type="password"
          className="w-full px-4 py-3 rounded-md bg-gray-300 text-red-400 placeholder-white focus:outline-none focus:ring-2 focus:ring-red-600"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full py-3 rounded-md bg-red-700 text-white font-bold hover:bg-red-800 transition-colors duration-300"
        >
          Update Password
        </button>
      </form>

      {message && (
        <p className="text-center text-red-200 text-sm animate-fadeIn">
          {message}
        </p>
      )}

      <style>{`
        @keyframes fadeIn {
          0% {opacity: 0;}
          100% {opacity: 1;}
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default Setting;
