import { useState } from "react";

const Categories = ["Technology", "Travel", "Lifestyle", "Food", "Funny"];

export default function PostUploader() {
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");

  const handleUpload = async () => {
    if (!caption || !imageUrl || !category) return alert("Fill all fields");

    const res = await fetch("http://localhost:8000/posts/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption, imageUrl, category, userId: "12345" }),
    });

    const data = await res.json();
    console.log("Uploaded:", data);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Image URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <input
        type="text"
        placeholder="Caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Select Category</option>
        {Categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <button onClick={handleUpload}>Upload Post</button>
    </div>
  );
}
