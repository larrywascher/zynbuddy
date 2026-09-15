"use client";

interface AdPlaceholderProps {
  size?: "banner" | "sidebar" | "leaderboard";
  className?: string;
}

export default function AdPlaceholder({
  size = "banner",
  className = "",
}: AdPlaceholderProps) {
  const sizeClasses = {
    banner: "h-16",
    sidebar: "h-64",
    leaderboard: "h-24",
  };

  return (
    <div
      className={`bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">
        Ad Space — {size}
      </span>
    </div>
  );
}
