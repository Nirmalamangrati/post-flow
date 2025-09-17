import React, { useEffect, useState } from "react";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
}

interface ProfileViewProps {
  userId: string;
}

const API_BASE = "http://localhost:8000/api";

const ProfileView: React.FC<ProfileViewProps> = ({ userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        if (!token) throw new Error("No auth token");

        const res = await fetch(`${API_BASE}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.msg || "Failed to fetch profile");
        }

        const data: UserProfile = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!profile) return <p>No profile data</p>;

  return (
    <div>
      <h2>{profile.name}'s Profile</h2>
      <p>Email: {profile.email}</p>
      {/* Add more profile details here */}
    </div>
  );
};

export default ProfileView;
