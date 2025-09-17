import type React from "react"

interface AvatarProps {
  src?: string
  alt: string
  size?: "sm" | "md" | "lg"
  className?: string
  children?: React.ReactNode
}

export function Avatar({ src, alt, size = "md", className = "", children }: AvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-300 flex items-center justify-center ${className}`}
    >
      {src ? (
        <img src={src || "/placeholder.svg"} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-medium text-gray-600">
          {children ||
            alt
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
        </span>
      )}
    </div>
  )
}
