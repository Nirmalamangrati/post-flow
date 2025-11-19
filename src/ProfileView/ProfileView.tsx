import React, { useEffect, useState } from "react";

interface Post {
  _id: string;
  caption: string;
  imageUrl: string;
  createdAt: string;
}

interface ProfileViewProps {
  userId: string;
}

const API_BASE = "http://localhost:8000/api";

const ProfileView: React.FC<ProfileViewProps> = ({ userId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        if (!token) throw new Error("No auth token");

        const res = await fetch(`${API_BASE}/profilehandler/my-post`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to fetch posts");
        }

        const data: Post[] = await res.json();
        setPosts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userId]);

  if (loading) return <p>Loading posts...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (posts.length === 0) return <p>No posts found</p>;

  return (
    <div>
      <h2>User Posts</h2>
      {posts.map((post) => (
        <div
          key={post._id}
          style={{
            border: "1px solid #ccc",
            margin: "10px 0",
            padding: "10px",
          }}
        >
          <p>
            <strong>Caption:</strong> {post.caption}
          </p>
          <p>
            <strong>Posted on:</strong>{" "}
            {new Date(post.createdAt).toLocaleString()}
          </p>
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Post"
              style={{ width: "200px", marginTop: "5px", borderRadius: "5px" }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ProfileView;
