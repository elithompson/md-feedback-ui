import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentThread } from "../CommentThread";
import type { Comment } from "../../types";

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: "comment-1",
    filePath: "/root/README.md",
    startLine: 5,
    endLine: 8,
    blockType: "paragraph",
    selectedText: "Some selected text",
    comment: "This needs revision",
    screenshots: [],
    ...overrides,
  };
}

describe("CommentThread", () => {
  it("renders comment text", () => {
    render(
      <CommentThread
        comment={makeComment()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("This needs revision")).toBeInTheDocument();
  });

  it("renders quoted selectedText block", () => {
    render(
      <CommentThread
        comment={makeComment({ selectedText: "The quoted block" })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const quote = document.querySelector(".comment-thread__quote");
    expect(quote).toBeInTheDocument();
    expect(quote!.textContent).toBe("The quoted block");
  });

  it('renders line range badge "Lines 5-8"', () => {
    render(
      <CommentThread
        comment={makeComment({ startLine: 5, endLine: 8 })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Lines 5-8")).toBeInTheDocument();
  });

  it("clicking Edit calls onEdit with comment id", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <CommentThread
        comment={makeComment({ id: "abc-123" })}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith("abc-123");
  });

  it("clicking Delete calls onDelete with comment id", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <CommentThread
        comment={makeComment({ id: "abc-123" })}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("abc-123");
  });

  it("has data-comment-id attribute matching comment.id", () => {
    render(
      <CommentThread
        comment={makeComment({ id: "thread-42" })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const thread = document.querySelector(".comment-thread");
    expect(thread).toHaveAttribute("data-comment-id", "thread-42");
  });

  it('renders "Line 5" for single-line comment', () => {
    render(
      <CommentThread
        comment={makeComment({ startLine: 5, endLine: 5 })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Line 5")).toBeInTheDocument();
  });
});
