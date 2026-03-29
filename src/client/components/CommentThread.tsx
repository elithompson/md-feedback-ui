import type { Comment } from "../types";

interface CommentThreadProps {
  comment: Comment;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CommentThread({ comment, onEdit, onDelete }: CommentThreadProps) {
  const lineLabel =
    comment.startLine === comment.endLine
      ? `Line ${comment.startLine}`
      : `Lines ${comment.startLine}-${comment.endLine}`;

  return (
    <div className="comment-thread" data-comment-id={comment.id}>
      <div className="comment-thread__badge">{lineLabel}</div>
      <div className="comment-thread__quote">{comment.selectedText}</div>
      <div className="comment-thread__text">{comment.comment}</div>
      {comment.screenshots.length > 0 && (
        <div className="comment-thread__thumbnails">
          {comment.screenshots.map((screenshot, index) => (
            <img
              key={index}
              src={URL.createObjectURL(screenshot)}
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
