import { useState } from "react";

type CommentInputProps = {
  uniqueId: string;
  handleComment: (uniqueId: string, text: string) => void;
};

export default function CommentInput(props: CommentInputProps) {
  const [commentText, setCommentText] = useState("");
  const [inputEnabled, setInputEnabled] = useState(false);

  const handleButtonClick = () => {
    if (!inputEnabled) {
      setInputEnabled(true);
    } else {
      if (!commentText.trim()) return;
      props.handleComment(props.uniqueId, commentText);
      setCommentText("");
      setInputEnabled(false);
    }
  };

  return (
    <div className="flex items-center mt-2">
      <input
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Add comment..."
        className="px-2 py-1 rounded flex-1"
        disabled={!inputEnabled}
      />
      <button
        onClick={handleButtonClick}
        className="text-green-600 cursor-pointer ml-2"
      >
        💬 Comment
      </button>
    </div>
  );
}
