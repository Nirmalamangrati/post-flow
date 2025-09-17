"use client";

import type { Post } from "../types/post";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ViewPostModalProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewPostModal({
  post,
  open,
  onOpenChange,
}: ViewPostModalProps) {
  if (!post) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{post.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>By {post.author}</span>
            <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="prose max-w-none">
            <p className="text-sm leading-relaxed">{post.content}</p>
          </div>

          <div className="flex justify-between text-xs text-muted-foreground pt-4 border-t">
            <span>
              Created: {new Date(post.createdAt).toLocaleDateString()}
            </span>
            <span>
              Updated: {new Date(post.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
