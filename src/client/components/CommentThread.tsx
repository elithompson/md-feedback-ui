import { useMemo, useEffect } from "react";
import type { Comment } from "../types";
import { formatLineLabel } from "../format-line-label";

interface CommentThreadProps {
  comment: Comment;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CommentThread({ comment, onEdit, onDelete }: CommentThreadProps) {
  const lineLabel = formatLineLabel(comment.startLine, comment.endLine);

  const screenshotUrls = useMemo(
    () => comment.screenshots.map((s) => URL.createObjectURL(s)),
    [comment.screenshots],
  );

  useEffect(() => {
    return () => {
      screenshotUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [screenshotUrls]);

  return (
    <div className="comment-thread" data-comment-id={comment.id}>
      <div className="comment-thread__badge">{lineLabel}</div>
      <div className="comment-thread__quote">{comment.selectedText}</div>
      <div className="comment-thread__text">{comment.comment}</div>
      {screenshotUrls.length > 0 && (
        <div className="comment-thread__thumbnails">
          {screenshotUrls.map((url, index) => (
            <img
              key={url}
              src={url}
              alt={`Screenshot ${index + 1}`}
            />
          ))}
        </div>
      )}
      <div className="comment-thread__actions">
        <button onClick={() => onEdit(comment.id)}>Edit</button>
        <button onClick={() => onDelete(comment.id)}>Delete</button>
      </div>
    </div>
  );
}
