import { useCallback, useState } from "react";
import type { ActiveCommentForm, Comment } from "../types";

export function useComments(): {
  comments: Map<string, Comment[]>;
  activeForm: ActiveCommentForm | null;
  getCommentsForFile: (filePath: string) => Comment[];
  getCommentCount: () => number;
  showCommentForm: (form: Omit<ActiveCommentForm, "editingId">) => void;
  cancelComment: () => void;
  addComment: (text: string, screenshots?: File[]) => void;
  editComment: (id: string, newText: string) => void;
  deleteComment: (filePath: string, id: string) => void;
  startEditing: (filePath: string, id: string) => void;
} {
  const [comments, setComments] = useState<Map<string, Comment[]>>(new Map());
  const [activeForm, setActiveForm] = useState<ActiveCommentForm | null>(null);

  const getCommentsForFile = useCallback(
    (filePath: string): Comment[] => {
      return comments.get(filePath) ?? [];
    },
    [comments],
  );

  const getCommentCount = useCallback((): number => {
    let count = 0;
    for (const fileComments of comments.values()) {
      count += fileComments.length;
    }
    return count;
  }, [comments]);

  const showCommentForm = useCallback(
    (form: Omit<ActiveCommentForm, "editingId">) => {
      setActiveForm(form);
    },
    [],
  );

  const cancelComment = useCallback(() => {
    setActiveForm(null);
  }, []);

  const addComment = useCallback(
    (text: string, screenshots?: File[]) => {
      if (!activeForm) return;

      if (activeForm.editingId) {
        setComments((prev) => {
          const next = new Map(prev);
          const fileComments = next.get(activeForm.filePath) ?? [];
          next.set(
            activeForm.filePath,
            fileComments.map((c) =>
              c.id === activeForm.editingId ? { ...c, comment: text } : c,
            ),
          );
          return next;
        });
      } else {
        const newComment: Comment = {
          id: crypto.randomUUID(),
          filePath: activeForm.filePath,
          startLine: activeForm.startLine,
          endLine: activeForm.endLine,
          blockType: activeForm.blockType,
          selectedText: activeForm.selectedText,
          comment: text,
          screenshots: screenshots ?? [],
        };

        setComments((prev) => {
          const next = new Map(prev);
          const existing = next.get(activeForm.filePath) ?? [];
          next.set(activeForm.filePath, [...existing, newComment]);
          return next;
        });
      }

      setActiveForm(null);
    },
    [activeForm],
  );

  const editComment = useCallback((id: string, newText: string) => {
    setComments((prev) => {
      const next = new Map(prev);
      for (const [filePath, fileComments] of next) {
        const idx = fileComments.findIndex((c) => c.id === id);
        if (idx !== -1) {
          next.set(
            filePath,
            fileComments.map((c) =>
              c.id === id ? { ...c, comment: newText } : c,
            ),
          );
          break;
        }
      }
      return next;
    });
  }, []);

  const deleteComment = useCallback((filePath: string, id: string) => {
    setComments((prev) => {
      const next = new Map(prev);
      const fileComments = next.get(filePath);
      if (fileComments) {
        const filtered = fileComments.filter((c) => c.id !== id);
        if (filtered.length === 0) {
          next.delete(filePath);
        } else {
          next.set(filePath, filtered);
        }
      }
      return next;
    });
  }, []);

  const startEditing = useCallback(
    (filePath: string, id: string) => {
      const fileComments = comments.get(filePath) ?? [];
      const comment = fileComments.find((c) => c.id === id);
      if (!comment) return;

      setActiveForm({
        filePath: comment.filePath,
        startLine: comment.startLine,
        endLine: comment.endLine,
        blockType: comment.blockType,
        selectedText: comment.selectedText,
        editingId: comment.id,
      });
    },
    [comments],
  );

  return {
    comments,
    activeForm,
    getCommentsForFile,
    getCommentCount,
    showCommentForm,
    cancelComment,
    addComment,
    editComment,
    deleteComment,
    startEditing,
  };
}
