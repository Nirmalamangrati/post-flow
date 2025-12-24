import {
  useRef,
  useState,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

type Comment = {
  _id?: string;
  text: string;
  createdAt: string;
};

type Post = {
  image: any;
  mediaUrl: string;
  _id?: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  likes?: number;
  likedByUser?: boolean;
  comments?: Comment[];
};

const userId = localStorage.getItem("userId");

export default function Profile() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fullname, setFullname] = useState("");
  const [caption, setCaption] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastUploadedImageUrl, setLastUploadedImageUrl] = useState<
    string | null
  >(null);

  const [openCommentBoxPostId, setOpenCommentBoxPostId] = useState<
    string | null
  >(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {}
  );

  const [sharePostId, setSharePostId] = useState<string | null>(null);

  // Editing states for posts
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string>("");

  // Editing states for comments
  const [editingComment, setEditingComment] = useState<{
    postId: string;
    commentId: string;
    text: string;
  } | null>(null);

  const handleCircleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  //profile image upload
  const handleUpload = async () => {
    if (!imageFile || !userId) {
      alert("Please select an image!");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("caption", caption);
    formData.append("userId", userId);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/profilehandler", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Upload failed:", data);
        alert("Upload failed. Check console for details.");
        return;
      }

      if (!data || !data.imageUrl) {
        console.error("Invalid response:", data);
        alert("Upload failed. No image returned.");
        return;
      }

      // Add new post to state safely
      setPosts((prev) => [...prev, data]);
      setImageFile(null); // reset input
      setCaption(""); // reset caption
    } catch (err) {
      console.error("Upload error:", err);
      alert("Something went wrong during upload.");
    }
  };

  // New fetchMyPost function with token authorization
  const fetchMyPost = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:8000/profilehandler/my-post", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch user posts");

      const data = await res.json();

      const postsWithLikeInfo = data.map((post: Post) => ({
        ...post,
        likedByUser: false,
      }));

      setPosts(postsWithLikeInfo);

      if (data.length > 0) {
        setLastUploadedImageUrl(`http://localhost:8000${data[0].imageUrl}`);
      }
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8000/profilehandler/${postId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();

      setPosts(
        posts.map((post) =>
          post._id === postId
            ? { ...post, likes: data.likes, likedByUser: data.likedByUser }
            : post
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCommentBox = (postId: string) => {
    setOpenCommentBoxPostId((prev) => (prev === postId ? null : postId));
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const submitComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8000/profilehandler/${postId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        }
      );
      const data = await res.json();

      setPosts(
        posts.map((post) =>
          post._id === postId ? { ...post, comments: data.comments } : post
        )
      );

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentKeyPress = (
    e: KeyboardEvent<HTMLInputElement>,
    postId: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitComment(postId);
    }
  };

  const buildPostUrl = (postId: string) => {
    return `http://localhost:8000/post/${postId}`;
  };

  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "width=600,height=400");
  };

  const toggleShareMenu = (postId: string) => {
    setSharePostId((prev) => (prev === postId ? null : postId));
  };

  // Edit post caption
  const startEditing = (postId: string, currentCaption: string) => {
    setEditingPostId(postId);
    setEditingCaption(currentCaption);
  };

  const saveEdit = async (postId: string) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:8000/profilehandler/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ caption: editingCaption }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to update");
      }

      const data = await res.json();

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, caption: data.caption } : post
        )
      );
      setEditingPostId(null);
      setEditingCaption("");
    } catch (err) {
      console.error("Failed to update caption:", err);
      alert("Caption update failed. Try again.");
    }
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditingCaption("");
  };

  // Delete post
  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(
        `http://localhost:8000/profilehandler/${postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.ok) {
        setPosts(posts.filter((post) => post._id !== postId));
      } else {
        alert("Failed to delete post");
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // Edit comment and updateed
  const saveEditedComment = async (
    postId: string,
    commentId: string,
    newText: string
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to edit comments");
        return;
      }

      const res = await fetch(
        `http://localhost:8000/profilehandler/${postId}/comment/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newText }),
        }
      );

      if (!res.ok) throw new Error("Failed to update comment");

      const data = await res.json();

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, comments: data.comments } : post
        )
      );

      setEditingComment(null);
    } catch (err) {
      console.error("Failed to update comment", err);
      alert("Failed to update comment");
    }
  };

  // Delete comment  API call
  const deleteComment = async (postId: string, commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(
        `http://localhost:8000/profilehandler/${postId}/comment/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) {
        alert("Failed to delete comment");
        return;
      }

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments?.filter(
                  (comment) => comment._id !== commentId
                ),
              }
            : post
        )
      );
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  // Start editing a comment
  const startEditComment = (
    postId: string,
    commentId: string,
    text: string
  ) => {
    setEditingComment({ postId, commentId, text });
  };

  // Cancel editing comment
  const cancelEditComment = () => {
    setEditingComment(null);
  };

  useEffect(() => {
    const storedName = localStorage.getItem("fullname");
    if (storedName) {
      setFullname(storedName);
    }
    fetchMyPost();
  }, []);

  useEffect(() => {
    const lastImageUrl = posts[0]?.imageUrl ?? "";
    setLastUploadedImageUrl(lastImageUrl);
    console.log(posts, "@all posts");
  }, [posts]);

  return (
    <div
      className="min-h-screen flex flex-col items-center py-10 space-y-6 
                relative w-full max-w-3xl mx-auto
                  bg-gradient-to-br from-white to-gray-100 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                overflow-y-auto p-8"
    >
      <h1 className="text-4xl font-bold mb-6">Welcome, {fullname}!</h1>

      {/* Upload Section */}
      <div className="flex flex-col items-center space-y-4">
        <div
          className="w-52 h-52 rounded-full border-4 border-red-900 bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition overflow-hidden"
          onClick={handleCircleClick}
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover rounded-full"
            />
          ) : lastUploadedImageUrl ? (
            <img
              src={lastUploadedImageUrl}
              alt="Last Uploaded"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-black font-bold text-lg">Upload Photo</span>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <input
          type="text"
          placeholder="What's on your mind?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="px-4 py-2 border border-gray-400 rounded w-80 focus:outline-none focus:ring-2 focus:ring-red-500"
        />

        <button
          onClick={handleUpload}
          className="w-80 bg-gradient-to-r from-red-800 to-black text-white py-2 rounded font-semibold hover:opacity-90 transition"
        >
          Post
        </button>
      </div>

      {/* Posts Section */}
      <div className="w-full max-w-xl px-4 space-y-6 relative">
        {posts
          .filter((post) => post && post.imageUrl)
          .map((post, index) => (
            <div
              key={index}
              className="bg-white shadow rounded-lg p-4 space-y-2  relative"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={post.imageUrl}
                  className="w-10 h-10 rounded-full  object-cover"
                  alt={post.caption || "Post image"}
                />
                <div>
                  <h4 className="font-semibold text-gray-800">You</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-2 relative">
                {/* Editable caption */}
                {editingPostId === post._id ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={editingCaption}
                    onChange={(e) => setEditingCaption(e.target.value)}
                    onBlur={() => saveEdit(post._id!)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        saveEdit(post._id!);
                      } else if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-gray-700 text-base mb-2 cursor-text select-text"
                    onDoubleClick={() =>
                      post._id && startEditing(post._id, post.caption)
                    }
                    title="Double click to edit caption"
                  >
                    {post.caption}
                  </p>
                )}

                {post.imageUrl || post.mediaUrl ? (
                  <img
                    src={post.imageUrl || post.mediaUrl}
                    alt="Post"
                    className="w-full rounded-lg object-cover "
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                    No image available
                  </div>
                )}

                {/* Delete icon */}
                <span
                  onClick={() => post._id && deletePost(post._id)}
                  className="absolute top-2 right-2 cursor-pointer text-red-600 text-xl select-none"
                  title="Delete post"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                      post._id && deletePost(post._id);
                    }
                  }}
                >
                  🗑️
                </span>
              </div>

              {/* Like, Comment, Share */}
              <div className="flex space-x-6 mt-3">
                <button
                  onClick={() => post._id && handleLike(post._id)}
                  className={`font-semibold ${
                    post.likedByUser ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  ❤️ Like {post.likes ?? 0}
                </button>
                <button
                  onClick={() => post._id && toggleCommentBox(post._id)}
                  className="font-semibold text-gray-600"
                >
                  💬 Comment
                </button>
                <button
                  onClick={() => post._id && toggleShareMenu(post._id)}
                  className="font-semibold text-gray-600 relative"
                >
                  ↗️ Share
                </button>
              </div>

              {/* Share menu */}
              {sharePostId === post._id && (
                <div className="absolute bg-white border rounded shadow p-2 mt-2 space-x-3 z-50 right-4">
                  <span
                    onClick={() =>
                      post._id &&
                      openShareWindow(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                          buildPostUrl(post._id)
                        )}`
                      )
                    }
                    className="text-blue-600 font-bold cursor-pointer select-none"
                  >
                    Facebook
                  </span>
                  <span
                    onClick={() =>
                      post._id &&
                      openShareWindow(
                        `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                          buildPostUrl(post._id)
                        )}&text=${encodeURIComponent(post.caption)}`
                      )
                    }
                    className="text-blue-400 font-bold cursor-pointer select-none"
                  >
                    Twitter
                  </span>
                  <span
                    onClick={() =>
                      post._id &&
                      openShareWindow(
                        `https://wa.me/?text=${encodeURIComponent(
                          buildPostUrl(post._id)
                        )}`
                      )
                    }
                    className="text-green-600 font-bold cursor-pointer select-none"
                  >
                    WhatsApp
                  </span>
                  <span
                    onClick={() =>
                      post._id &&
                      openShareWindow(
                        `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                          buildPostUrl(post._id)
                        )}&title=${encodeURIComponent(post.caption)}`
                      )
                    }
                    className="text-blue-700 font-bold cursor-pointer select-none"
                  >
                    LinkedIn
                  </span>
                </div>
              )}

              {/* Comment box */}
              {openCommentBoxPostId === post._id && (
                <>
                  <div className="mt-2">
                    <input
                      id={`comment-input-${post._id}`}
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post._id ?? ""] || ""}
                      onChange={(e) =>
                        post._id &&
                        handleCommentChange(post._id, e.target.value)
                      }
                      onKeyDown={(e) =>
                        post._id && handleCommentKeyPress(e, post._id)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                    {(post.comments || []).map((comment) => {
                      const isEditing =
                        editingComment &&
                        editingComment.postId === post._id &&
                        editingComment.commentId === comment._id;

                      return (
                        <div
                          key={comment._id}
                          className="bg-gray-100 p-2 rounded space-y-1  w-[calc(100%-280px)]"
                        >
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                className="w-full px-2 py-1 border rounded"
                                value={editingComment.text}
                                onChange={(e) =>
                                  setEditingComment((prev) =>
                                    prev
                                      ? { ...prev, text: e.target.value }
                                      : null
                                  )
                                }
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (!editingComment) return;
                                    await saveEditedComment(
                                      editingComment.postId,
                                      editingComment.commentId,
                                      editingComment.text
                                    );
                                  } else if (e.key === "Escape") {
                                    cancelEditComment();
                                  }
                                }}
                                autoFocus
                              />
                              <div className="flex space-x-2 mt-1">
                                <button
                                  className="text-green-600 font-semibold"
                                  onClick={() =>
                                    editingComment &&
                                    saveEditedComment(
                                      editingComment.postId,
                                      editingComment.commentId,
                                      editingComment.text
                                    )
                                  }
                                >
                                  Save
                                </button>
                                <button
                                  className="text-red-600 font-semibold"
                                  onClick={cancelEditComment}
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm">{comment.text}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(comment.createdAt).toLocaleString()}
                              </p>
                              <div className="flex space-x-3 mt-1">
                                <button
                                  className="text-blue-600 text-xs underline"
                                  onClick={() =>
                                    post._id &&
                                    comment._id &&
                                    startEditComment(
                                      post._id,
                                      comment._id,
                                      comment.text
                                    )
                                  }
                                >
                                  ✏️
                                </button>
                                <button
                                  className="text-red-600 text-xs underline"
                                  onClick={() =>
                                    post._id &&
                                    comment._id &&
                                    deleteComment(post._id, comment._id)
                                  }
                                >
                                  🗑️
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
