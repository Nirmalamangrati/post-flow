import { useEffect, useState, type ChangeEvent } from "react";

type CommentType = {
  _id: string;
  userId: string;
  text: string;
};

type Post = {
  _id: string;
  caption: string;
  imageUrl?: string;
  mediaType?: "photo" | "video";
  likes: number;
  likedBy: string[];
  comments: CommentType[];
  createdAt?: string;
};

// Define the available categories
const categories = ["technology", "travel", "funny", "food", "lifestyle"];

export default function Dashboard() {
  const [caption, setCaption] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCaption, setModalCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"photo" | "video" | null>(null);

  const [commentTextMap, setCommentTextMap] = useState<Record<string, string>>(
    {}
  );
  const [commentEditMap, setCommentEditMap] = useState<Record<string, string>>(
    {}
  );
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string>("");

  const [sharePostId, setSharePostId] = useState<string | null>(null);

  const userId = localStorage.getItem("userId") || "";
  const fullName = localStorage.getItem("fullName") || "";

  const [isSearching, setIsSearching] = useState(false);
  const [searchResultsFound, setSearchResultsFound] = useState(true);

  const [activeFilter, setActiveFilter] = useState("all");

  const [friendRequestsList, setFriendRequestsList] = useState<
    { _id: string; fromUserId: string; fromName: string }[]
  >([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  useEffect(() => {
    async function fetchFriendRequests() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8000/api/friends/all", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setFriendRequestsList(data);
      } catch (err) {
        console.error("Error fetching friend requests:", err);
      }
    }

    fetchFriendRequests();
  }, []);

  const toggleFriendRequests = () => setShowFriendRequests((prev) => !prev);

  useEffect(() => {
    console.log("User ID:", userId);
    console.log("Full Name:", fullName);
    console.log("image", selectedFile);
    fetchPosts();
  }, [userId, fullName, selectedFile]);

  async function fetchPosts(filter = "all") {
    try {
      const url =
        filter === "all"
          ? "http://localhost:8000/dashboard"
          : `http://localhost:8000/dashboard?filter=${encodeURIComponent(
              filter
            )}`;

      const res = await fetch(url);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setPosts([]);
    }
  }

  function resetModal() {
    setModalCaption("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType(null);
  }

  function onFileChange(
    e: ChangeEvent<HTMLInputElement>,
    type: "photo" | "video"
  ) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMediaType(type);
    }
  }

  async function handleMediaPost() {
    let imageUrl = null;
    if (selectedFile) {
      const formData = new FormData();
      formData.append("media", selectedFile);
      const uploadRes = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url;
    }

    const res = await fetch("http://localhost:8000/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: modalCaption,
        imageUrl,
        mediaType,
        userId,
        fullName,
      }),
    });
    const newPost = await res.json();
    setPosts([newPost, ...posts]);
    setIsModalOpen(false);
    resetModal();
  }

  async function handleLike(postId: string) {
    try {
      const res = await fetch(
        `http://localhost:8000/dashboard/like/${postId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        return alert(err.error || "Failed to like/unlike post");
      }

      const updated = await res.json();

      setPosts(posts.map((p) => (p._id === postId ? updated : p)));
    } catch (err) {
      console.error("Like error:", err);
      alert("Something went wrong while liking/unliking the post.");
    }
  }

  async function handleComment(postId: string) {
    const commentText = commentTextMap[postId];
    if (!commentText || !commentText.trim()) return;

    const res = await fetch(
      `http://localhost:8000/dashboard/comment/${postId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text: commentText }),
      }
    );
    const updated = await res.json();
    setPosts(posts.map((p) => (p._id === postId ? updated : p)));
    setCommentTextMap({ ...commentTextMap, [postId]: "" });
  }

  async function handleDeleteComment(postId: string, commentId: string) {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    const res = await fetch(
      `http://localhost:8000/dashboard/comment/${postId}/${commentId}`,
      {
        method: "DELETE",
      }
    );
    if (res.ok) {
      const updated = await res.json();
      setPosts(posts.map((p) => (p._id === postId ? updated : p)));
      if (editingCommentId === commentId) setEditingCommentId(null);
    } else {
      alert("Failed to delete comment");
    }
  }

  function startEditingComment(commentId: string, currentText: string) {
    setEditingCommentId(commentId);
    setCommentEditMap({ ...commentEditMap, [commentId]: currentText });
  }

  function cancelEditing() {
    setEditingCommentId(null);
  }

  async function saveEditedComment(postId: string, commentId: string) {
    const newText = commentEditMap[commentId];
    if (!newText || !newText.trim())
      return alert("Comment text cannot be empty");

    const res = await fetch(
      `http://localhost:8000/dashboard/comment/${postId}/${commentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText }),
      }
    );

    if (res.ok) {
      const updated = await res.json();
      setPosts(posts.map((p) => (p._id === postId ? updated : p)));
      setEditingCommentId(null);
    } else {
      alert("Failed to update comment");
    }
  }

  function openShareModal(postId: string) {
    setSharePostId(postId);
  }

  function closeShareModal() {
    setSharePostId(null);
  }

  function getPostById(id: string) {
    return posts.find((p) => p._id === id);
  }

  function shareToPlatform(platform: "facebook" | "twitter" | "whatsapp") {
    if (!sharePostId) return;
    const post = getPostById(sharePostId);
    if (!post) return;

    const url = `${window.location.origin}/post/${post._id}`;
    const text = encodeURIComponent(post.caption || "");
    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url
        )}&text=${text}`;
        break;
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(
          url
        )}`;
        break;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
    closeShareModal();
  }

  function startEditingPost(post: Post) {
    setEditingPostId(post._id);
    setEditingCaption(post.caption);
  }

  function cancelEditingPost() {
    setEditingPostId(null);
    setEditingCaption("");
  }

  async function saveEditedPost(postId: string) {
    if (!editingCaption.trim()) {
      alert("Caption cannot be empty");
      return;
    }

    const res = await fetch(`http://localhost:8000/dashboard/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: editingCaption }),
    });

    if (res.ok) {
      const updated = await res.json();
      setPosts(posts.map((p) => (p._id === postId ? updated : p)));
      setEditingPostId(null);
      setEditingCaption("");
    } else {
      alert("Failed to update post");
    }
  }

  async function deletePost(postId: string) {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    const res = await fetch(`http://localhost:8000/dashboard/${postId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setPosts(posts.filter((p) => p._id !== postId));
    } else {
      alert("Failed to delete post");
    }
  }

  async function applyFilter(categoryOrKeyword: string) {
    setIsSearching(true);
    setActiveFilter(categoryOrKeyword);
    setCaption(categoryOrKeyword === "all" ? "" : categoryOrKeyword);

    try {
      const url =
        categoryOrKeyword === "all"
          ? "http://localhost:8000/dashboard"
          : `http://localhost:8000/dashboard?filter=${encodeURIComponent(
              categoryOrKeyword
            )}`;

      const res = await fetch(url);
      const data = await res.json();

      setSearchResultsFound(data.length > 0);
      setPosts(data);
    } catch (err) {
      console.error("Error fetching filtered posts:", err);
      setSearchResultsFound(false);
      setPosts([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAccept(requestId: string) {
    try {
      const token = localStorage.getItem("token"); // get the JWT token
      const res = await fetch(
        // FIX: Added the missing forward slash after the port number 8000
        `http://localhost:8000/api/friends/accept/${requestId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // send token here
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // Remove accepted request from list
      setFriendRequestsList((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err) {
      console.error("Error accepting friend request:", err);
    }
  }

  async function handleReject(requestId: string) {
    try {
      await fetch(`http://localhost:8000/friend-requests/reject/${requestId}`, {
        method: "POST",
      });
      setFriendRequestsList((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err) {
      console.error("Error rejecting friend request:", err);
    }
  }

  return (
    <div className="sticky top-0 ml-40 w-[calc(100%-280px)]  min-h-screen overflow-y-auto">
      <h1>Welcome {fullName}</h1>
      <p>You are: {userId}</p>
      {/* New Parent Div to contain ALL three icons */}
      <div className="flex items-center gap-50">
        {/* 1. Friend Request Icon and Dropdown (Keep it relative for the absolute dropdown) */}
        <div className="relative">
          <button onClick={toggleFriendRequests} className="p-2 ml-50 rounded">
            👥
            {friendRequestsList.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
                {friendRequestsList.length}
              </span>
            )}
          </button>

          {showFriendRequests && (
            // Note: I moved the dropdown to align right/end of the button
            <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-lg rounded-lg z-50">
              {friendRequestsList.length === 0 ? (
                <p className="p-2 text-gray-500 text-sm">No friend requests</p>
              ) : (
                friendRequestsList.map((req) => (
                  <div
                    key={req._id}
                    className="flex justify-between items-center p-2 hover:bg-gray-100"
                  >
                    <span>{req.fromName}</span>
                    <div className="flex gap-2">
                      <button
                        className="text-green-500"
                        onClick={() => handleAccept(req._id)}
                      >
                        Accept
                      </button>
                      <button
                        className="text-red-500"
                        onClick={() => handleReject(req._id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button className="p-2 rounded">💬</button>

        <button className="p-2 rounded">🔔</button>
      </div>

      <div className=" flex gap-4 items-center mb-3">
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder=" What's on your mind ? Search posts..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none"
        />

        <button
          onClick={() => {
            if (!caption.trim()) {
              setIsSearching(true);
              setPosts([]);
              return;
            }
            // Use the search term to apply the filter
            applyFilter(caption.trim());
          }}
          className="bg-red-700 text-white px-4 py-2 rounded-full hover:bg-red-900"
        >
          Search
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-700 text-white px-4 py-2 rounded-full hover:bg-red-900"
        >
          + Media Post
        </button>
      </div>

      {/* FILTER BAR IMPLEMENTATION */}
      <div className="sticky filter-bar">
        <div className="flex">
          {/* Default 'All' button to reset filter */}
          <div
            className={`mx-3 p-2 rounded cursor-pointer ${
              activeFilter === "all" ? "bg-blue-600 text-white" : "bg-blue-200"
            }`}
            onClick={() => applyFilter("all")}
          >
            All Posts
          </div>

          {/* Mapping the defined categories */}
          {categories.map((category) => (
            <div
              key={category}
              className={`mx-3 p-2 rounded cursor-pointer capitalize ${
                activeFilter === category
                  ? "bg-blue-600 text-white"
                  : "bg-blue-200"
              }`}
              // CALL THE FUNCTION HERE to filter posts
              onClick={() => applyFilter(category)}
            >
              {category}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isSearching ? (
          <p className="text-center font-semibold">Loading...</p>
        ) : posts.length === 0 && !searchResultsFound ? (
          <p className="text-center text-red-600 font-semibold">
            No posts found for your search.
          </p>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="p-4 rounded shadow bg-white">
              <div className="flex justify-end gap-2 mb-2">
                <button
                  onClick={() => startEditingPost(post)}
                  className="text-blue-600"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deletePost(post._id)}
                  className="text-red-600"
                >
                  🗑️
                </button>
              </div>

              {editingPostId === post._id ? (
                <>
                  <textarea
                    value={editingCaption}
                    onChange={(e) => setEditingCaption(e.target.value)}
                    rows={3}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEditedPost(post._id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditingPost}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-center font-semibold">{post.caption}</p>
                  {post.createdAt && (
                    <p className="text-center text-sm text-gray-500">
                      Posted on {new Date(post.createdAt).toLocaleString()}
                    </p>
                  )}
                  <div className="flex justify-center mt-2">
                    {post.mediaType === "photo" && post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        className="max-h-60 rounded"
                        alt="post media"
                      />
                    )}
                    {post.mediaType === "video" && post.imageUrl && (
                      <video
                        src={post.imageUrl}
                        controls
                        className="max-h-60 rounded"
                      />
                    )}
                  </div>
                  <div className="mt-3 flex gap-4 items-center">
                    <button
                      onClick={() => handleLike(post._id)}
                      className="text-red-600"
                    >
                      ❤️ Like ({post.likes})
                    </button>
                    <input
                      value={commentTextMap[post._id] || ""}
                      onChange={(e) =>
                        setCommentTextMap({
                          ...commentTextMap,
                          [post._id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleComment(post._id);
                        }
                      }}
                      placeholder="Add comment..."
                      className="px-2 py-1 rounded flex-1"
                    />
                    <button
                      onClick={() => handleComment(post._id)}
                      className="text-green-600"
                    >
                      💬
                    </button>
                    <button
                      onClick={() => openShareModal(post._id)}
                      className="text-blue-600"
                    >
                      ↗️ Share
                    </button>
                  </div>

                  <ul className="mt-2 ml-3 text-sm text-gray-700">
                    {post.comments?.map((c) => (
                      <li key={c._id} className="mb-1">
                        <b>{c.userId}</b>:{" "}
                        {editingCommentId === c._id ? (
                          <>
                            <input
                              type="text"
                              value={commentEditMap[c._id] || ""}
                              onChange={(e) =>
                                setCommentEditMap({
                                  ...commentEditMap,
                                  [c._id]: e.target.value,
                                })
                              }
                              className="border px-1 py-0.5 rounded mr-2"
                            />
                            <button
                              onClick={() => saveEditedComment(post._id, c._id)}
                              className="text-green-600 mr-2"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-red-600"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {c.text}{" "}
                            {c.userId === userId && (
                              <>
                                <button
                                  onClick={() =>
                                    startEditingComment(c._id, c.text)
                                  }
                                  className="text-blue-600 ml-2"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteComment(post._id, c._id)
                                  }
                                  className="text-red-600 ml-1"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed top-1/2 left-1/2 bg-white border shadow rounded w-[400px] p-4 z-50 transform -translate-x-1/2 -translate-y-1/2">
          <h2 className="text-lg font-bold text-center mb-3">
            Create Media Post
          </h2>
          <textarea
            value={modalCaption}
            onChange={(e) => setModalCaption(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full p-2 border rounded mb-3"
          />
          <div className="flex gap-4 mb-3">
            <label className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
              📷 Photo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onFileChange(e, "photo")}
              />
            </label>
            <label className="cursor-pointer bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">
              🎥 Video
              <input
                type="file"
                accept="video/*"
                hidden
                onChange={(e) => onFileChange(e, "video")}
              />
            </label>
          </div>
          {previewUrl && mediaType === "photo" && (
            <img
              src={previewUrl}
              alt="preview"
              className="mb-3 max-h-48 rounded mx-auto"
            />
          )}
          {previewUrl && mediaType === "video" && (
            <video
              src={previewUrl}
              controls
              className="mb-3 max-h-48 rounded mx-auto"
            />
          )}
          <div className="flex justify-between">
            <button
              onClick={handleMediaPost}
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            >
              Post
            </button>
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetModal();
              }}
              className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {sharePostId && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-80">
            <h3 className="mb-4 text-lg font-bold text-center">Share Post</h3>
            <div className="flex justify-around mb-4">
              <button
                onClick={() => shareToPlatform("facebook")}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Facebook
              </button>
              <button
                onClick={() => shareToPlatform("twitter")}
                className="bg-sky-500 text-white px-3 py-1 rounded"
              >
                Twitter
              </button>
              <button
                onClick={() => shareToPlatform("whatsapp")}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                WhatsApp
              </button>
            </div>
            <button
              onClick={closeShareModal}
              className="bg-gray-500 text-white px-3 py-1 rounded w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
