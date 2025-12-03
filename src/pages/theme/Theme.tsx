import React, { useState, useEffect, type KeyboardEvent, useRef } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
};

const StatCard = ({ label, value }: StatCardProps) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="text-gray-500">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

type Comment = { _id: string; text: string };
type Post = {
  _id: string;
  text: string;
  frame: string;
  imageUrl: string;
  mediaUrl: string;
  mediaType: string;
  likes: number;
  likedByUser: boolean;
  comments: Comment[];
};

const changeCase = (to: "upper" | "lower") => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  if (!selectedText) return;
  const transformed =
    to === "upper" ? selectedText.toUpperCase() : selectedText.toLowerCase();
  document.execCommand("insertText", false, transformed);
};

export default function Theme() {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleFormat = (style: "bold" | "italic" | "underline") => {
    document.execCommand(style);
  };

  const handleInput = () => {
    setPostText(editorRef.current?.innerHTML || "");
  };

  const [profileFrame, setProfileFrame] = useState("frame1");
  const [selectedFrame, setSelectedFrame] = useState("frame1");
  const [postText, setPostText] = useState("");
  const [postMedia, setPostMedia] = useState<File | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [filterFrame, setFilterFrame] = useState<string | "all">("all");
  const [openCommentBoxPostId, setOpenCommentBoxPostId] = useState<
    string | null
  >(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {}
  );
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostText, setEditingPostText] = useState<string>("");
  const [editingComment, setEditingComment] = useState<{
    postId: string;
    commentId: string;
  } | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>("");

  const frames = [
    {
      _id: "frame1",
      name: "Classic Pink",
      style: "bg-pink-100 border-pink-500 text-pink-700",
      borderColor: "#ec4899",
      extraClass: "anim-pulse-border",
    },
    {
      _id: "frame2",
      name: "Nature Green",
      style: "bg-green-100 border-green-600 text-green-800",
      borderColor: "#16a34a",
      extraClass: "anim-glow-border",
    },
    {
      _id: "frame3",
      name: "Sky Blue",
      style: "bg-blue-100 border-blue-500 text-blue-700",
      borderColor: "#3b82f6",
      extraClass: "anim-rotate-border",
    },
    {
      _id: "frame4",
      name: "Sunset Orange",
      style: "bg-orange-100 border-orange-500 text-orange-700",
      borderColor: "#f97316",
      extraClass: "anim-bounce-border",
    },
    {
      _id: "frame5",
      name: "Royal Purple",
      style: "bg-purple-900 border-purple-700 text-purple-300",
      borderColor: "#7c3aed",
      extraClass: "anim-shadow-glow",
    },
    {
      _id: "frame6",
      name: "Cool Teal",
      style: "bg-teal-900 border-teal-700 text-teal-300",
      borderColor: "#0d9488",
      extraClass: "anim-slide-border",
    },
    {
      _id: "frame7",
      name: "Sunny Yellow",
      style: "bg-yellow-100 border-yellow-500 text-yellow-800",
      borderColor: "#ca8a04",
      extraClass: "flower-frame anim-flower-spin",
    },
    {
      _id: "frame8",
      name: "Rose Red",
      style: "bg-rose-900 border-rose-700 text-rose-300",
      borderColor: "#be123c",
      extraClass: "dark-frame flower-frame anim-glow-flower",
    },
  ];

  const currentFrame = frames.find((f) => f._id === selectedFrame) || frames[0];
  const profileFrameObj =
    frames.find((f) => f._id === profileFrame) || frames[0];

  // Fetch posts from backend
  useEffect(() => {
    fetch("http://localhost:8000/theme")
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error(err));
  }, []);

  const formatNumber = (num?: number) => {
    if (num == null) return "0";
    return num >= 1000 ? (num / 1000).toFixed(1) + "K" : num.toString();
  };

  const handlePost = async () => {
    if (!postText && !postMedia) return;
    const formData = new FormData();
    formData.append("caption", postText);
    formData.append("frame", selectedFrame);
    if (postMedia) formData.append("image", postMedia);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/theme-upload", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      const newPost = await res.json();
      setPosts((prev) => [newPost, ...prev]);
      setPostText("");
      setPostMedia(null);
      if (editorRef.current) editorRef.current.innerHTML = "";
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts =
    filterFrame === "all"
      ? posts
      : posts.filter((p) => p.frame === filterFrame);

  const handleLike = async (postId: string) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:8000/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedPost = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCommentBox = (postId: string) => {
    setOpenCommentBoxPostId((prev) => (prev === postId ? null : postId));
    if (sharePostId) setSharePostId(null);
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const submitComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text) return;
    try {
      const res = await fetch(
        `http://localhost:8000/posts/${postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }
      );
      const updatedPost = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
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

  const toggleShareMenu = (postId: string) => {
    setSharePostId((prev) => (prev === postId ? null : postId));
    if (openCommentBoxPostId) setOpenCommentBoxPostId(null);
  };

  const buildPostUrl = (postId: string) =>
    encodeURIComponent(`http://localhost:3000/post/${postId}`);
  const openShareWindow = (url: string) =>
    window.open(url, "_blank", "width=600,height=400");

  const startEditingPost = (post: Post) => {
    setEditingPostId(post._id);
    setEditingPostText(post.text);
  };
  const cancelEditingPost = () => {
    setEditingPostId(null);
    setEditingPostText("");
  };
  const saveEditedPost = async (postId: string) => {
    if (!editingPostText.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editingPostText }),
      });
      const updatedPost = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
      cancelEditingPost();
    } catch (err) {
      console.error(err);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await fetch(`http://localhost:8000/posts/${postId}`, {
        method: "DELETE",
      });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  const isVideo = (post: Post) => {
    if (post.mediaType) return post.mediaType.startsWith("video/");
    if (post.mediaUrl)
      return post.mediaUrl.endsWith(".mp4") || post.mediaUrl.endsWith(".webm");
    return false;
  };

  const startEditingComment = (
    postId: string,
    commentId: string,
    text: string
  ) => {
    setEditingComment({ postId, commentId });
    setEditingCommentText(text);
  };
  const cancelEditingComment = () => {
    setEditingComment(null);
    setEditingCommentText("");
  };
  const saveEditedComment = async (postId: string, commentId: string) => {
    if (!editingCommentText.trim()) return;
    try {
      const res = await fetch(
        `http://localhost:8000/posts/${postId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: editingCommentText }),
        }
      );
      const updatedPost = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
      cancelEditingComment();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8000/posts/${postId}/comments/${commentId}`,
        { method: "DELETE" }
      );
      const updatedPost = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterFrame(e.target.value);
  };

  return (
    <div className="fixed min-h-screen ml-[70px] p-6 top-0 bg-gray-50 rounded-2xl shadow-lg">
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
              {frames.map((frame) => (
                <div
                  key={frame._id}
                  className={`w-6 h-6 rounded-full border-2 border-white cursor-pointer ${
                    frame.style
                  } ${
                    profileFrame === frame._id ? "ring-2 ring-pink-500" : ""
                  }`}
                  onClick={() => setProfileFrame(frame._id)}
                  title={frame.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
            <StatCard label="Total Posts" value={posts.length} />

            <StatCard
              label="Engagement"
              value={`${(posts.length * 1).toFixed(1)}%`}
            />
          </div>

          {/* Filter Selector */}
          <div className="mb-6">
            <label className="mr-2 font-semibold">Filter posts by frame:</label>
            <select
              className="border border-gray-300 rounded px-2 py-1"
              value={filterFrame}
              onChange={handleFilterChange}
            >
              <option value="all">All</option>
              {frames.map((frame) => (
                <option key={frame._id} value={frame._id}>
                  {frame.name}
                </option>
              ))}
            </select>
          </div>

          {/* Post Creator */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {frames.map((frame) => (
              <div
                key={frame._id}
                className={`relative cursor-pointer rounded-lg border-4 p-4 text-center transition transform hover:scale-105 ${
                  selectedFrame === frame._id
                    ? "ring-4 ring-offset-2 ring-pink-500"
                    : "border-transparent"
                } ${frame.style} ${frame.extraClass}`}
                onClick={() => setSelectedFrame(frame._id)}
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

          {/* Editor */}
          <div
            className={`rounded-2xl border-4 p-6 shadow-md transition duration-300 ${currentFrame.style} ${currentFrame.extraClass}`}
            style={{ borderColor: currentFrame.borderColor }}
          >
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => handleFormat("bold")}
                className="px-2 py-1 bg-pink-200 rounded"
              >
                Bold
              </button>
              <button
                onClick={() => handleFormat("italic")}
                className="px-2 py-1 bg-blue-200 rounded"
              >
                Italic
              </button>
              <button
                onClick={() => handleFormat("underline")}
                className="px-2 py-1 bg-green-200 rounded"
              >
                Underline
              </button>
              <button
                onClick={() => changeCase("upper")}
                className="px-2 py-1 bg-purple-200 rounded"
              >
                Uppercase
              </button>
              <button
                onClick={() => changeCase("lower")}
                className="px-2 py-1 bg-yellow-200 rounded"
              >
                Lowercase
              </button>
            </div>

            <div className="mt-4">
              <h3 className="font-bold mb-1">Saved Output:</h3>
            </div>

            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              style={{
                border: "1px solid gray",
                minHeight: "100px",
                padding: "8px",
                borderRadius: "4px",
                outline: "none",
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
              }}
              suppressContentEditableWarning={true}
            ></div>

            <div className="mt-4 mb-4">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setPostMedia(e.target.files?.[0] ?? null)}
              />
              {postMedia && (
                <div className="mt-2">
                  <strong>Selected media:</strong> {postMedia.name}
                </div>
              )}
            </div>

            <button
              onClick={handlePost}
              className="px-6 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition"
            >
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post._id}
              className={`p-4 rounded-lg border-4 shadow-lg relative ${
                frames.find((f) => f._id === post.frame)?.style
              }`}
              style={{
                borderColor: frames.find((f) => f._id === post.frame)
                  ?.borderColor,
              }}
            >
              <div className="flex justify-between items-center mb-2">
                {editingPostId === post._id ? (
                  <textarea
                    value={editingPostText}
                    onChange={(e) => setEditingPostText(e.target.value)}
                    className="w-full border rounded p-2"
                    rows={3}
                  />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{ __html: post.text }}
                    className="mb-2"
                  />
                )}
                <div className="flex gap-2 ml-2">
                  {editingPostId === post._id ? (
                    <>
                      <button
                        onClick={() => saveEditedPost(post._id)}
                        className="text-green-600 font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditingPost}
                        className="text-red-600 font-semibold"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditingPost(post)}
                        className="text-blue-600 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePost(post._id)}
                        className="text-red-600 font-semibold"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {post.mediaUrl && (
                <div className="mb-2">
                  {isVideo(post) ? (
                    <video
                      src={post.mediaUrl}
                      controls
                      className="max-w-full rounded"
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt="Post media"
                      className="max-w-full rounded"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={() => handleLike(post._id)}
                  className={`px-2 py-1 rounded ${
                    post.likedByUser ? "bg-red-400 text-white" : "bg-gray-200"
                  }`}
                >
                  ❤️ {formatNumber(post.likes)}
                </button>
                <button
                  onClick={() => toggleCommentBox(post._id)}
                  className="px-2 py-1 rounded bg-gray-200"
                >
                  💬 {post.comments?.length || 0}
                </button>
                <button
                  onClick={() => toggleShareMenu(post._id)}
                  className="px-2 py-1 rounded bg-gray-200"
                >
                  🔗 Share
                </button>
              </div>

              {/* Comment Box */}
              {openCommentBoxPostId === post._id && (
                <div className="mb-2">
                  {post.comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="flex justify-between items-center mb-1 bg-gray-100 p-1 rounded"
                    >
                      {editingComment?.postId === post._id &&
                      editingComment.commentId === comment._id ? (
                        <>
                          <input
                            type="text"
                            value={editingCommentText}
                            onChange={(e) =>
                              setEditingCommentText(e.target.value)
                            }
                            className="border rounded px-2 py-1 flex-1 mr-2"
                          />
                          <button
                            onClick={() =>
                              saveEditedComment(post._id, comment._id)
                            }
                            className="text-green-600 font-semibold mr-1"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditingComment}
                            className="text-red-600 font-semibold"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span>{comment.text}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                startEditingComment(
                                  post._id,
                                  comment._id,
                                  comment.text
                                )
                              }
                              className="text-blue-600 font-semibold text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                deleteComment(post._id, comment._id)
                              }
                              className="text-red-600 font-semibold text-sm"
                            >
                              Del
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <input
                    type="text"
                    placeholder="Add a comment"
                    value={commentInputs[post._id] || ""}
                    onChange={(e) =>
                      handleCommentChange(post._id, e.target.value)
                    }
                    onKeyDown={(e) => handleCommentKeyPress(e, post._id)}
                    className="border rounded w-full px-2 py-1 mt-1"
                  />
                  <button
                    onClick={() => submitComment(post._id)}
                    className="mt-1 px-4 py-1 bg-pink-500 text-white rounded hover:bg-pink-600"
                  >
                    Add Comment
                  </button>
                </div>
              )}

              {/* Share Menu */}
              {sharePostId === post._id && (
                <div className="flex flex-col gap-1 mt-2">
                  <button
                    onClick={() =>
                      openShareWindow(
                        `https://www.facebook.com/sharer/sharer.php?u=${buildPostUrl(
                          post._id
                        )}`
                      )
                    }
                    className="bg-blue-600 text-white rounded px-2 py-1"
                  >
                    Share to Facebook
                  </button>
                  <button
                    onClick={() =>
                      openShareWindow(
                        `https://twitter.com/intent/tweet?url=${buildPostUrl(
                          post._id
                        )}`
                      )
                    }
                    className="bg-blue-400 text-white rounded px-2 py-1"
                  >
                    Share to Twitter
                  </button>
                  <button
                    onClick={() =>
                      openShareWindow(
                        `https://www.linkedin.com/shareArticle?mini=true&url=${buildPostUrl(
                          post._id
                        )}`
                      )
                    }
                    className="bg-blue-800 text-white rounded px-2 py-1"
                  >
                    Share to LinkedIn
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
