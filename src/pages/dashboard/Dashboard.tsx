import { useEffect, useState, type ChangeEvent } from "react";
import ChatWindow from "../chats/Chats";
import NotificationBell from "../notification/NotificationBell";
type User = {
  _id: string;
  fullname: string;
  profileImage?: string;
};

type CommentType = {
  _id: string;
  userId: User;
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
interface Props {
  posts: Post[];
  userId: string;
  handleLike: (postId: string) => void;
  filterFrame: string;
}
// Define the available categories
// const categories = ["technology", "travel", "funny", "food", "lifestyle"];

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
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [commentInputOpen, setCommentInputOpen] = useState<{
    [key: string]: boolean;
  }>({});

  //get friend request in dashboard
  useEffect(() => {
    async function fetchFriendRequests() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          "https://backend-of-postflow-fioq.vercel.app/api/friends/get-friend-requests",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

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
          ? "https://backend-of-postflow-fioq.vercel.app/dashboard"
          : `https://backend-of-postflow-fioq.vercel.app/dashboard?filter=${encodeURIComponent(
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
      const uploadRes = await fetch(
        "https://backend-of-postflow-fioq.vercel.app/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url;
    }

    const res = await fetch(
      "https://backend-of-postflow-fioq.vercel.app/dashboard",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: modalCaption,
          imageUrl,
          mediaType,
          userId,
          fullName,
        }),
      }
    );
    const newPost = await res.json();
    setPosts([newPost, ...posts]);
    setIsModalOpen(false);
    resetModal();
  }

  async function handleLike(postId: string) {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `https://backend-of-postflow-fioq.vercel.app/dashboard/${postId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        return alert(err.error || "Failed to like/unlike post");
      }
      const updated = await res.json();
      setPosts(
        posts.map((p) =>
          p._id === postId
            ? { ...p, likes: updated.likes, likedByUser: updated.likedByUser }
            : p
        )
      );
    } catch (err) {
      console.error("Like error:", err);
      alert("Something went wrong while liking/unliking the post.");
    }
  }

  async function handleComment(postId: string) {
    const token = localStorage.getItem("token");
    const commentText = commentTextMap[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      const res = await fetch(
        `https://backend-of-postflow-fioq.vercel.app/dashboard/comment/${postId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: commentText }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Comment failed");
      }

      const updatedPost = await res.json();

      console.log(" New comment user data:", {
        fullname:
          updatedPost.comments[updatedPost.comments.length - 1]?.userId
            ?.fullname,
        profileImage:
          updatedPost.comments[updatedPost.comments.length - 1]?.userId
            ?.profileImage,
        allComments: updatedPost.comments.slice(-2),
      });

      setPosts((prevPosts) =>
        prevPosts.map((p) => (p._id === postId ? updatedPost : p))
      );

      setCommentTextMap((prev) => ({
        ...prev,
        [postId]: "",
      }));

      setCommentInputOpen((prev) => ({
        ...prev,
        [postId]: false,
      }));
    } catch (err: any) {
      console.error("Failed to add comment:", err);
      alert(err.message || "Failed to add comment");
    }
  }

  async function handleDeleteComment(postId: string, commentId: string) {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `https://backend-of-postflow-fioq.vercel.app/dashboard/comment/${postId}/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const updatedPost = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
        );
        if (editingCommentId === commentId) setEditingCommentId(null);
      } else {
        const errorData = await res.json();
        alert(errorData.msg || "Failed to delete comment");
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
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

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `https://backend-of-postflow-fioq.vercel.app/dashboard/comment/${postId}/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newText }),
        }
      );

      if (res.ok) {
        const updatedPost = await res.json();

        setPosts((prev) =>
          prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
        );

        setEditingCommentId(null);
      } else {
        const errorData = await res.json();
        alert(errorData.msg || "Failed to update comment");
      }
    } catch (err) {
      console.error("Failed to update comment:", err);
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

    const res = await fetch(
      `https://backend-of-postflow-fioq.vercel.app/dashboard/${postId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editingCaption }),
      }
    );

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

    const res = await fetch(
      `https://backend-of-postflow-fioq.vercel.app/dashboard/${postId}`,
      {
        method: "DELETE",
      }
    );

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
          ? "https://backend-of-postflow-fioq.vercel.app/dashboard"
          : `https://backend-of-postflow-fioq.vercel.app/dashboard?filter=${encodeURIComponent(
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
  //Friend request accept
  const handleAccept = async (friendId: string) => {
    try {
      const res = await fetch(
        `https://backend-of-postflow-fioq.vercel.app/api/friends/accept/${friendId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log("Friend request accepted:", data);
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  async function handleReject(requestId: string) {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token found");

      // Call backend to remove friend
      const res = await fetch(
        `https://backend-of-postflow-fioq.vercel.app/api/friends/remove/${requestId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.msg || "Failed to remove friend");
      }

      // Remove from local state
      setFriendRequestsList((prev) => prev.filter((r) => r._id !== requestId));
      console.log("Friend removed successfully");
    } catch (err) {
      console.error("Error rejecting friend request:", err);
    }
  }

  return (
    <div
      className="sticky top-12 ml-32 w-[calc(100%-280px)] min-h-screen overflow-y-auto
                bg-gradient-to-br from-white to-gray-100 rounded-2xl shadow-lg p-6"
    >
      <img
        src="/postflow-logo1.png"
        alt="PostFlow Logo"
        className="absolute rounded-full shadow-lg left-2 top-5 h-10 animate-bounce "
      />

      {/* 
      <h1 className="text-xl text-bold">Welcome {fullName}</h1> */}
      <div className="flex items-center gap-30">
        <span
          className={`p-2 ml-45 text-2xl text-blue-600 font-bold cursor-pointer ${
            activeFilter === "all" ? " text-white" : "bg-red-400"
          }`}
          onClick={() => applyFilter("all")}
        >
          🏠
        </span>

        <div className="relative">
          <button
            onClick={toggleFriendRequests}
            className="p-4  ml-8 rounded cursor-pointer"
          >
            👥
            {friendRequestsList.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1 ">
                {friendRequestsList.length}
              </span>
            )}
          </button>

          {showFriendRequests && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-lg rounded-lg z-50">
              {friendRequestsList.length === 0 ? (
                <p className="p-4 text-gray-500 text-sm">No friend requests</p>
              ) : (
                friendRequestsList.map((req) => (
                  <div
                    key={req._id}
                    className="flex justify-between items-center p-2 hover:bg-gray-100"
                  >
                    <span>{req.name}</span>
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

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="p-2 rounded ml-12 cursor-pointer"
        >
          💬
        </button>

        <button
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          className="p-2 rounded ml-16 relative"
        >
          🔔
        </button>
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

      <div className="sticky filter-bar ">
        <div className="flex">
          {/* <div
            className={`mx-3 p-2 rounded cursor-pointer  ${
              activeFilter === "all" ? "bg-red-700 text-white" : "bg-red-400"
            }`}
            onClick={() => applyFilter("all")}
          >
            All Posts
          </div> */}

          {/* Mapping the defined categories */}
          {/* {categories.map((category) => (
            <div
              key={category}
              className={`mx-3 p-2 rounded cursor-pointer capitalize ${
                activeFilter === category
                  ? "bg-red-700 text-white"
                  : "bg-red-400"
              }`}
              // CALL THE FUNCTION HERE to filter posts
              onClick={() => applyFilter(category)}
            >
              {category}
            </div>
          ))} */}
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
              <div className="relative flex items-start justify-end">
                {/* Three Dots Button */}
                <button
                  onClick={() =>
                    setMenuOpen(menuOpen === post._id ? null : post._id)
                  }
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-full"
                >
                  ...
                </button>

                {/* Desktop Dropdown */}
                <div className="hidden md:block">
                  {menuOpen === post._id && (
                    <div className="absolute right-0 top-full mt-2 w-38 bg-white  rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => {
                          startEditingPost(post);
                          setMenuOpen(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => {
                          deletePost(post._id);
                          setMenuOpen(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-600 hover:bg-gray-100"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Swipe Menu */}
                <div
                  className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-30
                      ${
                        menuOpen === post._id
                          ? "translate-x-0"
                          : "translate-x-full"
                      } md:hidden`}
                >
                  <div className="flex justify-end p-4">
                    <button
                      onClick={() => setMenuOpen(null)}
                      className="text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-col px-4 gap-3 mt-2">
                    <button
                      onClick={() => {
                        startEditingPost(post);
                        setMenuOpen(null);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => {
                        deletePost(post._id);
                        setMenuOpen(null);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-gray-100 rounded"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {/* Overlay */}
                {menuOpen === post._id && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-20 z-20 md:hidden"
                    onClick={() => setMenuOpen(null)}
                  ></div>
                )}
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
                  <p
                    className="text-center font-semibold"
                    dangerouslySetInnerHTML={{ __html: post.caption }}
                  />

                  {post.createdAt && (
                    <p className="text-center text-sm text-gray-500">
                      Posted on {new Date(post.createdAt).toLocaleString()}
                    </p>
                  )}
                  <div className="flex justify-center mt-2 w-full ">
                    {/* {post.mediaType === "photo" && post.imageUrl && ( */}
                    <img
                      src={post.imageUrl}
                      className="w-[500px] h-[750px] object-cover rounded"
                      alt="post media"
                    />
                    {/* )} */}
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
                        setCommentTextMap((prev) => ({
                          ...prev,
                          [post._id]: e.target.value,
                        }))
                      }
                      placeholder="Add comment..."
                      className="px-2 py-1 rounded flex-1"
                      disabled={!commentInputOpen[post._id]}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();

                          if (!commentInputOpen[post._id]) {
                            setCommentInputOpen((prev) => ({
                              ...prev,
                              [post._id]: true,
                            }));
                            return;
                          }

                          handleComment(post._id);

                          setCommentInputOpen((prev) => ({
                            ...prev,
                            [post._id]: false,
                          }));
                        }
                      }}
                    />

                    <button
                      onClick={() => {
                        if (!commentInputOpen[post._id]) {
                          setCommentInputOpen((prev) => ({
                            ...prev,
                            [post._id]: true,
                          }));
                          return;
                        }

                        handleComment(post._id);

                        setCommentInputOpen((prev) => ({
                          ...prev,
                          [post._id]: false,
                        }));
                      }}
                      className="text-black cursor-pointer ml-2"
                    >
                      💬 Comment
                    </button>

                    <button
                      onClick={() => openShareModal(post._id)}
                      className="text-blue-600 cursor-pointer"
                    >
                      ↗️ Share
                    </button>
                  </div>

                  <ul className="mt-2 ml-3 text-sm text-gray-700">
                    {post.comments?.map((c) => (
                      <li key={c._id} className="mb-1 flex items-center ml-80">
                        <img
                          src={c.userId?.profileImage || "/default-profile.png"}
                          alt={`${c.userId?.fullname || "User"}`}
                          className="w-8 h-8 rounded-full mr-2 mt-0.5 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/default-profile.png";
                          }}
                        />
                        <div className=" relative  justify-center items-center">
                          <div className="font-medium text-sm truncate">
                            {c.userId?.fullname || "Unknown User"}
                          </div>
                          <div className="text-xs text-gray-500">{c.text}</div>

                          {editingCommentId === c._id ? (
                            <>
                              <input
                                type="text"
                                value={commentEditMap[c._id] || ""}
                                onChange={(e) => {
                                  console.log(
                                    "Editing comment text:",
                                    e.target.value
                                  );
                                  setCommentEditMap({
                                    ...commentEditMap,
                                    [c._id]: e.target.value,
                                  });
                                }}
                                className="border px-1 py-0.5 rounded mr-2"
                              />
                              <button
                                onClick={() =>
                                  saveEditedComment(post._id, c._id)
                                }
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
                              {c.userId?._id === userId && (
                                <div className="absolute justify-between ml-60 items-start left-50 top-[calc(100%-1.5rem)] flex flex-col z-80">
                                  {/* 3-dot button */}
                                  <button
                                    onClick={() =>
                                      setOpenMenuId(
                                        openMenuId === c._id ? null : c._id
                                      )
                                    }
                                    className="mt-0 text-gray-600 px-10 py-1 "
                                  >
                                    ⋯
                                  </button>

                                  {/* Comment Edit/Delete menu */}
                                  {openMenuId === c._id && (
                                    <div className="absolute top-1 right-16 bg-white rounded shadow-md flex flex-row z-10">
                                      <button
                                        onClick={() =>
                                          startEditingComment(c._id, c.text)
                                        }
                                        className="text-blue-600 px-2 py-1"
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteComment(post._id, c._id)
                                        }
                                        className="text-red-600 px-2 py-1"
                                      >
                                        🗑️ Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {isChatOpen && (
        <div className="w-80 h-180 bg-gray-100 p-4 border-l border-gray-200 fixed top-8 right-0  bottom-4 shadow-lg rounded">
          <ChatWindow />
        </div>
      )}

      {isNotificationOpen && (
        <div className="w-80 h-180 bg-gray-100 p-4 border-l border-gray-200 fixed top-8 right-0  bottom-4 shadow-lg rounded">
          <div className="bg-white w-full max-w-md max-h-[100vh] rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-black to-red-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold items-center justify-center">
                  Notifications
                </h3>
                <button
                  onClick={() => setIsNotificationOpen(false)}
                  className="text-white text-2xl hover:bg-black hover:bg-opacity-50 p-1 rounded-full"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              <p className="text-gray-500 text-center py-8">
                No notifications yet ...
              </p>
            </div>
          </div>
        </div>
      )}

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
