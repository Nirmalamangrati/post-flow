import React, { useState, type KeyboardEvent, useEffect } from "react";

type Post = {
  id: number;
  text: string;
  frame: string;
  mediaUrl?: string;
  mediaType?: string;
  likes: number;
  likedByUser: boolean;
  comments: { id: number; text: string }[];
};

export default function Theme() {
  const [profileFrame, setProfileFrame] = useState("frame1");
  const [selectedFrame, setSelectedFrame] = useState("frame1");
  const [postText, setPostText] = useState("");
  const [postMedia, setPostMedia] = useState<File | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filterFrame, setFilterFrame] = useState<string | "all">("all");

  const [openCommentBoxPostId, setOpenCommentBoxPostId] = useState< number | null >(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
  const [sharePostId, setSharePostId] = useState<number | null>(null);

  // For editing post
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingPostText, setEditingPostText] = useState<string>("");

  // For editing comment
  const [editingComment, setEditingComment] = useState<{
    postId: number;
    commentId: number;
  } | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>("");

  const frames = [
    {
      id: "frame1",
      name: "Classic Pink (Pulse)",
      style: "bg-pink-100 border-pink-500 text-pink-700",
      borderColor: "#ec4899",
      extraClass: "anim-pulse-border",
    },
    {
      id: "frame2",
      name: "Nature Green (Glow)",
      style: "bg-green-100 border-green-600 text-green-800",
      borderColor: "#16a34a",
      extraClass: "anim-glow-border",
    },
    {
      id: "frame3",
      name: "Sky Blue (Rotate)",
      style: "bg-blue-100 border-blue-500 text-blue-700",
      borderColor: "#3b82f6",
      extraClass: "anim-rotate-border",
    },
    {
      id: "frame4",
      name: "Sunset Orange (Bounce)",
      style: "bg-orange-100 border-orange-500 text-orange-700",
      borderColor: "#f97316",
      extraClass: "anim-bounce-border",
    },
    {
      id: "frame5",
      name: "Royal Purple (Shadow Glow)",
      style: "bg-purple-900 border-purple-700 text-purple-300",
      borderColor: "#7c3aed",
      extraClass: "anim-shadow-glow",
    },
    {
      id: "frame6",
      name: "Cool Teal (Slide)",
      style: "bg-teal-900 border-teal-700 text-teal-300",
      borderColor: "#0d9488",
      extraClass: "anim-slide-border",
    },
    {
      id: "frame7",
      name: "Sunny Yellow (Flower Spin)",
      style: "bg-yellow-100 border-yellow-500 text-yellow-800",
      borderColor: "#ca8a04",
      extraClass: "flower-frame anim-flower-spin",
    },
    {
      id: "frame8",
      name: "Rose Red (Dark Glow Flower)",
      style: "bg-rose-900 border-rose-700 text-rose-300",
      borderColor: "#be123c",
      extraClass: "dark-frame flower-frame anim-glow-flower",
    },
  ];

  const currentFrame = frames.find((f) => f.id === selectedFrame) || frames[0];
  const profileFrameObj =
    frames.find((f) => f.id === profileFrame) || frames[0];

  useEffect(() => {
    return () => {
      posts.forEach((post) => {
        if (post.mediaUrl && post.mediaUrl.startsWith("blob:")) {
          URL.revokeObjectURL(post.mediaUrl);
        }
      });
    };
    
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const handlePost = () => {
    if (!postText && !postMedia) return;

    let mediaUrl: string | undefined = undefined;
    let mediaType: string | undefined = undefined;
    if (postMedia) {
      mediaUrl = URL.createObjectURL(postMedia);
      mediaType = postMedia.type;
    }

    const newPost: Post = {
      id: Date.now(),
      text: postText,
      frame: selectedFrame,
      mediaUrl,
      mediaType,
      likes: 0,
      likedByUser: false,
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setPostText("");
    setPostMedia(null);
  };

  const filteredPosts =
    filterFrame === "all"
      ? posts
      : posts.filter((p) => p.frame === filterFrame);

  const handleLike = (postId: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              likedByUser: !post.likedByUser,
              likes: !post.likedByUser ? post.likes + 1 : post.likes - 1,
            }
          : post
      )
    );
  };

  const toggleCommentBox = (postId: number) => {
    setOpenCommentBoxPostId((prev) => (prev === postId ? null : postId));
    if (sharePostId) setSharePostId(null);
  };

  const handleCommentChange = (postId: number, text: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const submitComment = (postId: number) => {
    const text = commentInputs[postId];
    if (!text) return;

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, { id: Date.now(), text }],
            }
          : post
      )
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleCommentKeyPress = (
    e: KeyboardEvent<HTMLInputElement>,
    postId: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitComment(postId);
    }
  };

  const toggleShareMenu = (postId: number) => {
    setSharePostId((prev) => (prev === postId ? null : postId));
    if (openCommentBoxPostId) setOpenCommentBoxPostId(null);
  };

  const buildPostUrl = (postId: number) =>
    encodeURIComponent(`http://localhost:8000/post/${postId}`);

  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "width=600,height=400");
  };

  // Edit post handlers
  const startEditingPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditingPostText(post.text);
  };

  const cancelEditingPost = () => {
    setEditingPostId(null);
    setEditingPostText("");
  };

  const saveEditedPost = (postId: number) => {
    if (editingPostText.trim() === "") return;
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, text: editingPostText } : post
      )
    );
    setEditingPostId(null);
    setEditingPostText("");
  };

  const deletePost = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterFrame(value);
    if (value !== "all") setSelectedFrame(value);
  };

  const isVideo = (post: Post) => {
    if (post.mediaType) {
      return post.mediaType.startsWith("video/");
    }
    if (post.mediaUrl) {
      return post.mediaUrl.endsWith(".mp4") || post.mediaUrl.endsWith(".webm");
    }
    return false;
  };

  // --- Comment Edit/Delete Functions ---
  const startEditingComment = (
    postId: number,
    commentId: number,
    text: string
  ) => {
    setEditingComment({ postId, commentId });
    setEditingCommentText(text);
  };

  const cancelEditingComment = () => {
    setEditingComment(null);
    setEditingCommentText("");
  };

  const saveEditedComment = (postId: number, commentId: number) => {
    if (editingCommentText.trim() === "") return;
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((c) =>
                c.id === commentId ? { ...c, text: editingCommentText } : c
              ),
            }
          : post
      )
    );
    setEditingComment(null);
    setEditingCommentText("");
  };

  const deleteComment = (postId: number, commentId: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.filter((c) => c.id !== commentId),
            }
          : post
      )
    );
  };

  return (
    <div className="min-h-screen ml-70 p-4 relative">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Card */}
        <div
          className={`bg-white p-6 rounded-2xl shadow-md w-full md:w-1/3 profile-card cursor-pointer transition duration-300 transform hover:scale-105 hover:shadow-pink-300 ${profileFrameObj.style} ${profileFrameObj.extraClass}`}
        >
          <div className="flex flex-col items-center">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full border-4 flex items-center justify-center text-2xl font-bold text-gray-700"
                style={{ borderColor: profileFrameObj.borderColor }}
              >
                NM
              </div>
              <button className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow">
                📷
              </button>
            </div>
            <h2 className="mt-4 text-xl font-semibold">Nirmala Mangrati ✏️</h2>
            <p className="text-gray-500">Content Creator</p>
            <div className="mt-4 text-sm font-medium">Profile Frame</div>
            <div className="flex gap-2 mt-2">
              {frames.map((frame, i) => (
                <div
                  key={frame.id}
                  className={`w-6 h-6 rounded-full border-2 border-white cursor-pointer ${
                    frame.style
                  } ${profileFrame === frame.id ? "ring-2 ring-pink-500" : ""}`}
                  onClick={() => setProfileFrame(frame.id)}
                  title={frame.name}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Stats and Analytics */}
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Posts" value={`${posts.length}`} />
            <StatCard
              label="Followers"
              value={formatNumber(posts.length * 1)}
            />
            <StatCard
              label="Total Views"
              value={formatNumber(posts.length * 1)}
            />
            <StatCard
              label="Engagement"
              value={`${(posts.length * 1).toFixed(1)}%`}
            />
          </div>
          {/* Filter Posts by Frame */}
          <div className="mb-6">
            <label className="mr-2 font-semibold">Filter posts by frame:</label>
            <select
              className="border border-gray-300 rounded px-2 py-1"
              value={filterFrame}
              onChange={handleFilterChange}
            >
              <option value="all">All</option>
              {frames.map((frame) => (
                <option key={frame.id} value={frame.id}>
                  {frame.name}
                </option>
              ))}
            </select>
          </div>
          {/* Post Creator */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {frames.map((frame) => (
              <div
                key={frame.id}
                className={`relative cursor-pointer rounded-lg border-4 p-4 text-center transition transform hover:scale-105 ${
                  selectedFrame === frame.id
                    ? "ring-4 ring-offset-2 ring-pink-500"
                    : "border-transparent"
                } ${frame.style} ${frame.extraClass}`}
                onClick={() => setSelectedFrame(frame.id)}
              >
                <p className="font-semibold">{frame.name}</p>
                {frame.extraClass.includes("flower-frame") && (
                  <div className="absolute top-2 right-2 text-yellow-400 text-2xl">
                    🌸
                  </div>
                )}
              </div>
            ))}
          </div>
          <div
            className={`rounded-2xl border-4 p-6 shadow-md transition duration-300 ${currentFrame.style} ${currentFrame.extraClass}`}
            style={{ borderColor: currentFrame.borderColor }}
          >
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Write your blog, post or caption..."
              className={`w-full p-3 rounded mb-4 border resize-none ${
                currentFrame.style.includes("dark")
                  ? "bg-gray-800 text-white border-gray-700"
                  : "bg-white text-gray-900 border-gray-300"
              }`}
              rows={5}
            />
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setPostMedia(e.target.files?.[0] || null)}
              className="mb-4"
            />
            <button
              onClick={handlePost}
              className="px-6 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition"
            >
              Post
            </button>
          </div>
        </div>
      </div>
      {/* Posted Content */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">
          Your Posts {filterFrame !== "all" && `(Filtered)`}
        </h2>
        {filteredPosts.length === 0 && (
          <p className="text-gray-400">No posts to show.</p>
        )}
        <div className="grid gap-6">
          {filteredPosts.map((post) => {
            const frame = frames.find((f) => f.id === post.frame)!;
            return (
              <div
                key={post.id}
                className={`relative rounded-xl border-4 p-4 ${frame.style} ${frame.extraClass}`}
                style={{ borderColor: frame.borderColor }}
              >
                {/* Post text or edit input */}
                {editingPostId === post.id ? (
                  <>
                    <textarea
                      className="w-full p-2 mb-2 border rounded"
                      value={editingPostText}
                      onChange={(e) => setEditingPostText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => saveEditedPost(post.id)}
                        className="px-4 py-1 bg-green-600 text-white rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditingPost}
                        className="px-4 py-1 bg-gray-400 text-white rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="mb-2 whitespace-pre-wrap">{post.text}</p>
                )}
                {post.mediaUrl && (
                  <>
                    {isVideo(post) ? (
                      <video
                        src={post.mediaUrl}
                        controls
                        className="w-full max-h-96 rounded mb-2"
                      />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt="Uploaded"
                        className="w-full max-h-96 rounded mb-2"
                      />
                    )}
                  </>
                )}
                {/* Buttons: Like, Share, Edit, Delete (Comment button removed) */}
                <div className="flex space-x-4 mt-2 flex-wrap gap-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`font-semibold ${
                      post.likedByUser ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    ❤️ Like {post.likes > 0 ? formatNumber(post.likes) : ""}
                  </button>
                  <button
                    onClick={() => toggleCommentBox(post.id)}
                    className="font-semibold text-gray-600"
                  >
                    💬Comment
                  </button>
                  <button
                    onClick={() => toggleShareMenu(post.id)}
                    className="font-semibold text-gray-600 relative"
                  >
                    ↗️ Share
                  </button>
                  <button
                    onClick={() => startEditingPost(post)}
                    className="font-semibold text-blue-600"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="font-semibold text-red-600"
                  >
                    🗑️ Delete
                  </button>
                </div>
                {/* Share Menu */}
                {sharePostId === post.id && (
                  <div className="absolute bg-white border rounded shadow p-2 mt-2 space-x-3 z-50 right-4">
                    <span
                      onClick={() =>
                        openShareWindow(
                          `https://www.facebook.com/sharer/sharer.php?u=${buildPostUrl(
                            post.id
                          )}`
                        )
                      }
                      className="cursor-pointer text-blue-600"
                    >
                      Facebook
                    </span>
                    <span
                      onClick={() =>
                        openShareWindow(
                          `https://twitter.com/intent/tweet?url=${buildPostUrl(
                            post.id
                          )}`
                        )
                      }
                      className="cursor-pointer text-blue-400"
                    >
                      Twitter
                    </span>
                  </div>
                )}
                {/* Comment Box */}
                {openCommentBoxPostId === post.id && (
                  <div className="mt-4">
                    <input
                      type="text"
                      className="w-full p-2 border rounded mb-2"
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        handleCommentChange(post.id, e.target.value)
                      }
                      onKeyDown={(e) => handleCommentKeyPress(e, post.id)}
                    />
                  </div>
                )}
                {/* Comments */}
                {post.comments.length > 0 && (
                  <div className="mt-3">
                    <ul>
                      {post.comments.map((comment) => (
                        <li
                          key={comment.id}
                          className="mb-1 flex items-center gap-2 group"
                        >
                          {editingComment &&
                          editingComment.postId === post.id &&
                          editingComment.commentId === comment.id ? (
                            <>
                              <input
                                className="border rounded px-2 py-1 mr-2"
                                value={editingCommentText}
                                onChange={(e) =>
                                  setEditingCommentText(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveEditedComment(post.id, comment.id);
                                  }
                                  if (e.key === "Escape") {
                                    cancelEditingComment();
                                  }
                                }}
                              />
                              <button
                                className="text-green-600"
                                title="Save"
                                onClick={() =>
                                  saveEditedComment(post.id, comment.id)
                                }
                              >
                                ✔️
                              </button>
                              <button
                                className="text-gray-400"
                                title="Cancel"
                                onClick={cancelEditingComment}
                              >
                                ✖️
                              </button>
                            </>
                          ) : (
                            <>
                              <span>{comment.text}</span>
                              <button
                                className="ml-2 text-blue-500 opacity-70 hover:opacity-100"
                                title="Edit"
                                onClick={() =>
                                  startEditingComment(
                                    post.id,
                                    comment.id,
                                    comment.text
                                  )
                                }
                              >
                                ✏️
                              </button>
                              <button
                                className="ml-1 text-red-500 opacity-70 hover:opacity-100"
                                title="Delete"
                                onClick={() =>
                                  deleteComment(post.id, comment.id)
                                }
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
      <span className="text-lg font-semibold">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
