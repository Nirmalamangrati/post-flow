import { useRef, useState, useEffect, type ChangeEvent } from "react";

type Post = {
  imageUrl: string;
  caption: string;
  createdAt: string;
};

export default function Profile() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [caption, setCaption] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastUploadedImageUrl, setLastUploadedImageUrl] = useState<
    string | null
  >(null);

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

  const handleUpload = async () => {
    if (!imageFile) {
      alert("Please select an image!");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("caption", caption);

    try {
      const res = await fetch("http://localhost:8000/profilehandler", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const fullUrl = `http://localhost:8000${data.post.imageUrl}`;

      setPosts([data.post, ...posts]);
      setCaption("");
      setImageFile(null);
      setImagePreview(null);
      setLastUploadedImageUrl(fullUrl);
    } catch (err) {
      alert("Failed to upload post.");
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch("http://localhost:8000/profilehandler");
      const data = await res.json();
      setPosts(data);

      if (data.length > 0) {
        setLastUploadedImageUrl(`http://localhost:8000${data[0].imageUrl}`);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen ml-46 flex flex-col items-center py-8 space-y-6 relative overflow-y-auto top-0 left-1/2 transform -translate-x-1/2 w-full max-w-xl mx-auto">
      {/* Upload Section */}
      <div className="flex flex-col items-center space-y-4">
        {/* Profile Circle */}
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

        {/* Caption Input */}
        <input
          type="text"
          placeholder="What's on your mind?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="px-4 py-2 border border-gray-400 rounded w-80 focus:outline-none focus:ring-2 focus:ring-red-500"
        />

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          className="w-80 bg-gradient-to-r from-red-800 to-black text-white py-2 rounded font-semibold hover:opacity-90 transition"
        >
          Post
        </button>
      </div>

      {/* Posts Section */}
      <div className="w-full max-w-xl px-4 space-y-6">
        {posts.map((post, index) => (
          <div
            key={index}
            className="bg-white shadow rounded-lg p-4 space-y-2 border"
          >
            <div className="flex items-center space-x-3">
              <img
                src={`http://localhost:8000${post.imageUrl}`}
                className="w-10 h-10 rounded-full border object-cover"
                alt="profile"
              />
              <div>
                <h4 className="font-semibold text-gray-800">You</h4>
                <p className="text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-2">
              {post.caption && (
                <p className="text-gray-700 text-base mb-2">{post.caption}</p>
              )}
              <img
                src={`http://localhost:8000${post.imageUrl}`}
                className="w-full rounded-lg object-cover border"
                alt="Post"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
