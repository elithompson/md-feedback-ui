import type { ReviewFile } from "../types";

interface FileTabBarProps {
  files: ReviewFile[];
  activeIndex: number;
  commentCounts: Map<string, number>; // filePath -> count
  onTabChange: (index: number) => void;
}

export function FileTabBar({
  files,
  activeIndex,
  commentCounts,
  onTabChange,
}: FileTabBarProps) {
  return (
    <div className="tab-bar" role="tablist">
      {files.map((file, index) => {
        const count = commentCounts.get(file.path) ?? 0;
        return (
          <button
            key={file.path}
            role="tab"
            aria-selected={index === activeIndex}
            className={`tab${index === activeIndex ? " tab--active" : ""}`}
            onClick={() => onTabChange(index)}
          >
            {file.relativePath}
            {count > 0 && <span className="tab__badge">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
