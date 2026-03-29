import type { ReviewFile, Comment } from "../types";

interface ReviewSidebarProps {
  files: ReviewFile[];
  comments: Map<string, Comment[]>;
  onScrollToComment: (commentId: string) => void;
  onSubmit: () => void;
  submitted: boolean;
  outputPath: string | null;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function screenshotLabel(count: number): string {
  return count === 1 ? "1 screenshot" : `${count} screenshots`;
}

export function ReviewSidebar({
  files,
  comments,
  onScrollToComment,
  onSubmit,
  submitted,
  outputPath,
}: ReviewSidebarProps) {
  const totalComments = Array.from(comments.values()).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  if (submitted) {
    return (
      <aside className="review-sidebar">
        <div className="review-sidebar__confirmation">
          <div className="review-sidebar__checkmark">&#10003;</div>
          <h2>Review submitted!</h2>
          <code className="review-sidebar__output-path">{outputPath}</code>
          <p>Copied to clipboard</p>
          <p className="review-sidebar__secondary">You can close this tab</p>
        </div>
      </aside>
    );
  }

  const fileGroups = files
    .map((file) => ({
      file,
      fileComments: comments.get(file.path) ?? [],
    }))
    .filter(({ fileComments }) => fileComments.length > 0);

  return (
    <aside className="review-sidebar">
      <div className="review-sidebar__header">
        <span>Review</span>
        <span className="review-sidebar__count">{totalComments}</span>
      </div>

      <div className="review-sidebar__body">
        {fileGroups.map(({ file, fileComments }) => (
          <div key={file.path} className="review-sidebar__file-group">
            <div className="review-sidebar__file-header">
              {file.relativePath}
            </div>
            {fileComments.map((comment) => {
              const lineLabel =
                comment.startLine === comment.endLine
                  ? `Line ${comment.startLine}`
                  : `Lines ${comment.startLine}-${comment.endLine}`;

              return (
                <div
                  key={comment.id}
                  className="review-sidebar__comment-card"
                  onClick={() => onScrollToComment(comment.id)}
                >
                  <span className="review-sidebar__badge">{lineLabel}</span>
                  <span className="review-sidebar__text">
                    {truncate(comment.comment, 80)}
                  </span>
                  {comment.screenshots.length > 0 && (
                    <span className="review-sidebar__screenshots">
                      {screenshotLabel(comment.screenshots.length)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="review-sidebar__footer">
        <button
          className="review-sidebar__submit-btn"
          disabled={totalComments === 0}
          onClick={onSubmit}
        >
          Submit Review
        </button>
      </div>
    </aside>
  );
}
