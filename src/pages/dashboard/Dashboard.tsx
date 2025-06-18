import { useEffect, useState } from "react";

type Post = {
  _id: string; // ideally backend returns unique id for each post
  caption: string;
};

export default function Dashboard() {
  const [caption, setCaption] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);

  // For editing
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState("");

  // For showing/hiding the menu for each post
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  //for modal
  // const [isModalOpen, setIsModalOpen] = useState(true);

  // Fetch posts from server on load
  useEffect(() => {
    fetch("http://localhost:8000/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
      });
  }, []);

  // Handle posting new post
  const handlePost = async () => {
    if (!caption.trim()) {
      alert("Please write something before posting!");
      return;
    }

    const res = await fetch("http://localhost:8000/dashboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ caption }),
    });

    const newPost = await res.json();
    setPosts([newPost, ...posts]);
    setCaption("");
  };

  // Handle delete post
  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    await fetch(`http://localhost:8000/dashboard/${postId}`, {
      method: "DELETE",
    });

    setPosts(posts.filter((p) => p._id !== postId));
    setMenuOpenFor(null);
  };

  // Start editing post
  const startEdit = (post: Post) => {
    setEditingPostId(post._id);
    setEditingCaption(post.caption);
    setMenuOpenFor(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingPostId(null);
    setEditingCaption("");
  };

  // Save edited post
  const saveEdit = async () => {
    if (!editingCaption.trim()) {
      alert("Caption cannot be empty");
      return;
    }

    const res = await fetch(
      `http://localhost:8000/dashboard/${editingPostId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editingCaption }),
      }
    );

    const updatedPost = await res.json();

    setPosts(posts.map((p) => (p._id === editingPostId ? updatedPost : p)));
    setEditingPostId(null);
    setEditingCaption("");
  };

  return (
    <div className="ml-40 w-[1200px] mt-0 mb-0 min-h-screen overflow-y-auto">
      {/* Post input */}
      <div className="flex gap-4 items-center mb-3">
        <input
          type="text"
          placeholder="What's on your mind?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none"
        />

        <button
          type="button"
          onClick={handlePost}
          className="bg-red-700 text-white font-semibold px-4 py-2 rounded-full hover:bg-red-800 transition"
        >
          Post
        </button>
      </div>

      {/* Trending Challenge */}
      <div className="bg-white p-4 rounded-xl shadow relative mb-6">
        <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-gradient-to-b from-orange-400 to-yellow-400"></div>
        <div className="pl-4 font-semibold text-lg text-gray-800 flex items-center gap-2">
          <span>🔥</span> Trending Challenge
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post._id}
            className="p-3 border rounded bg-gray-50 shadow-sm relative"
          >
            {/* Three dots menu button */}
            <button
              className="absolute left-2 top-2 text-gray-500 hover:text-gray-800"
              onClick={() =>
                setMenuOpenFor(menuOpenFor === post._id ? null : post._id)
              }
              aria-label="Open menu"
            >
              ⋮
            </button>

            {/* Menu */}
            {menuOpenFor === post._id && (
              <div className="absolute left-8 top-2 bg-white border rounded shadow-md z-10 flex flex-col">
                <button
                  onClick={() => startEdit(post)}
                  className="px-3 py-1 hover:bg-gray-100"
                >
                  Update
                </button>
                <button
                  onClick={() => handleDelete(post._id)}
                  className="px-3 py-1 hover:bg-gray-100 text-red-600"
                >
                  Delete
                </button>
              </div>
            )}

            {/* Post content or edit input */}
            {editingPostId === post._id ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded"
                  value={editingCaption}
                  onChange={(e) => setEditingCaption(e.target.value)}
                />
                <button
                  onClick={saveEdit}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="ml-6">{post.caption}</p> // ml-6 to create space from left side dots
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
