import React, { useEffect, useState } from "react";
interface User {
  _id: string;
  name: string;
}

interface Comment {
  _id: string;
  userId: User;
  text: string;
}

interface Post {
  _id: string;
  userId: User;
  content: string;
  comments: Comment[];
}

const API_BASE = "http://localhost:8000/api";

const FriendsPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token");

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${API_BASE}/posts/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || "Failed to fetch posts");
      }

      const data: Post[] = await res.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (postId: string) => {
    const text = commentText[postId];
    if (!text) return;

    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${API_BASE}/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || "Failed to add comment");
      }

      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      fetchPosts(); // Refresh posts to show new comment
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "auto" }}>
      <h2>Friends' Posts</h2>
      {loading && <p>Loading posts...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && posts.length === 0 && <p>No posts available.</p>}
      {posts.map((post) => (
        <div
          key={post._id}
          style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}
        >
          <p>
            <b>{post.userId.name}</b>: {post.content}
          </p>
          <div>
            <h4>Comments:</h4>
            {post.comments.map((c) => (
              <p key={c._id}>
                <b>{c.userId.name}:</b> {c.text}
              </p>
            ))}
            <input
              type="text"
              placeholder="Add comment"
              value={commentText[post._id] || ""}
              onChange={(e) =>
                setCommentText((prev) => ({
                  ...prev,
                  [post._id]: e.target.value,
                }))
              }
            />
            <button onClick={() => addComment(post._id)}>Comment</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FriendsPosts;
