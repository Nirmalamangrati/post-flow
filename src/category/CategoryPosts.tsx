import { useState, useEffect } from "react";

type Post = {
  _id: string;
  imageUrl: string;
  caption: string;
  category: string;
};

const Categories = ["Technology", "Travel", "Lifestyle", "Food", "Funny"];

export default function CategoryPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const fetchPosts = async (category: string) => {
    const res = await fetch(
      `https://backend-of-postflow-fioq.vercel.app/posts/category/${category}`
    );
    const data = await res.json();
    setPosts(data);
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchPosts(selectedCategory);
    }
  }, [selectedCategory]);

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "200px", background: "#300", padding: "10px" }}>
        <h3 style={{ color: "white" }}>Categories</h3>
        {Categories.map((cat) => (
          <div
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              color: selectedCategory === cat ? "red" : "white",
              cursor: "pointer",
              marginBottom: "8px",
            }}
          >
            {cat}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: "1rem" }}>
        <h2>
          {selectedCategory ? `${selectedCategory} Posts` : "Select a category"}
        </h2>
        {posts.map((post) => (
          <div key={post._id} style={{ marginBottom: "20px" }}>
            <img
              src={post.imageUrl}
              style={{ width: "100%", maxWidth: "400px" }}
            />
            <p>{post.caption}</p>
            <small>{post.category}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
