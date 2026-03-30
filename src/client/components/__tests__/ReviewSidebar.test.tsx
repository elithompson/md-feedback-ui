import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewSidebar } from "../ReviewSidebar";
import type { ReviewFile, Comment } from "../../types";

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

function makeFile(overrides: Partial<ReviewFile> = {}): ReviewFile {
  return {
    path: "/root/README.md",
    relativePath: "README.md",
    content: "# Hello",
    lines: ["# Hello"],
    ...overrides,
  };
}

function makeScreenshotFile(name = "screenshot.png"): File {
  return new File(["fake-image-data"], name, { type: "image/png" });
}

describe("ReviewSidebar", () => {
  it("renders comment summaries grouped by file with file name headers", () => {
    const files = [
      makeFile({ path: "/root/README.md", relativePath: "README.md" }),
      makeFile({ path: "/root/DESIGN.md", relativePath: "DESIGN.md" }),
    ];
    const comments = new Map<string, Comment[]>([
      ["/root/README.md", [makeComment({ id: "c1", filePath: "/root/README.md" })]],
      ["/root/DESIGN.md", [makeComment({ id: "c2", filePath: "/root/DESIGN.md", comment: "Design issue" })]],
    ]);

    render(
      <ReviewSidebar
        files={files}
        comments={comments}
        onScrollToComment={vi.fn()}
        onSubmit={vi.fn()}
        submitted={false}
        outputPath={null}
      />,
    );

    expect(screen.getByText("README.md")).toBeInTheDocument();
    expect(screen.getByText("DESIGN.md")).toBeInTheDocument();
    expect(screen.getByText(/This needs revision/)).toBeInTheDocument();
    expect(screen.getByText(/Design issue/)).toBeInTheDocument();
  });

  it("each summary shows line range + truncated comment text (80 chars + ...)", () => {
    const longText = "A".repeat(100);
    const files = [makeFile()];
    const comments = new Map<string, Comment[]>([
      ["/root/README.md", [makeComment({ comment: longText })]],
    ]);

    render(
      <ReviewSidebar
        files={files}
        comments={comments}
        onScrollToComment={vi.fn()}
        onSubmit={vi.fn()}
        submitted={false}
        outputPath={null}
      />,
    );

    expect(screen.getByText("Lines 5-8")).toBeInTheDocument();
    const truncated = "A".repeat(80) + "...";
    expect(screen.getByText(truncated)).toBeInTheDocument();
  });

  it("clicking a summary calls onScrollToComment with the comment id", async () => {
    const onScrollToComment = vi.fn();
    const user = userEvent.setup();
    const files = [makeFile()];
    const comments = new Map<string, Comment[]>([
      ["/root/README.md", [makeComment({ id: "scroll-target" })]],
    ]);

    render(
      <ReviewSidebar
        files={files}
        comments={comments}
        onScrollToComment={onScrollToComment}
        onSubmit={vi.fn()}
        submitted={false}
        outputPath={null}
      />,
    );

    const card = document.querySelector(".review-sidebar__comment-card")!;
    await user.click(card);
    expect(onScrollToComment).toHaveBeenCalledWith("scroll-target");
  });

  it("Submit Review button is enabled even with 0 comments", () => {
    const files = [makeFile()];
    const comments = new Map<string, Comment[]>();

    render(
      <ReviewSidebar
        files={files}
        comments={comments}
        onScrollToComment={vi.fn()}
        onSubmit={vi.fn()}
        submitted={false}
        outputPath={null}
      />,
    );

    const button = screen.getByText("Submit Review");
    expect(button).toBeEnabled();
  });

  it("Submit Review button is enabled when comments exist", () => {
    const files = [makeFile()];
    const comments = new Map<string, Comment[]>([
      ["/root/README.md", [makeComment()]],
    ]);

    render(
      <ReviewSidebar
        files={files}
        comments={comments}
        onScrollToComment={vi.fn()}
        onSubmit={vi.fn()}
        submitted={false}
        outputPath={null}
      />,
    );

    const button = screen.getByText("Submit Review");
    expect(button).toBeEnabled();
  });

  it("clicking Submit calls onSubmit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const files = [makeFile()];
    const comments = new Map<string, Comment[]>([
      ["/root/README.md", [makeComment()]],
    ]);

    render(
      <ReviewSidebar
        files={files}
        comments={comments}
        onScrollToComment={vi.fn()}
        onSubmit={onSubmit}
        submitted={false}
        outputPath={null}
      />,
    );

    await user.click(screen.getByText("Submit Review"));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("file groups with 0 comments are not shown", () => {
    const files = [
      makeFile({ path: "/root/README.md", relativePath: "README.md" }),
      makeFile({ path: "/root/EMPTY.md", relativePath: "EMPTY.md" }),
    ];
    const comments = new Map<string, Comment[]>([
      ["/root/README.md", [makeComment()]],
      ["/root/EMPTY.md", []],
    ]);

    render(
      <ReviewSidebar
        files={files}
        comments={comments}
        onScrollToComment={vi.fn()}
        onSubmit={vi.fn()}
        submitted={false}
        outputPath={null}
      />,
    );

    expect(screen.getByText("README.md")).toBeInTheDocument();
    expect(screen.queryByText("EMPTY.md")).not.toBeInTheDocument();
  });

  it("after submit (submitted=true), shows confirmation with outputPath", () => {
    render(
      <ReviewSidebar
        files={[]}
        comments={new Map()}
        onScrollToComment={vi.fn()}
        onSubmit={vi.fn()}
        submitted={true}
        outputPath="/tmp/review.json"
      />,
    );

    expect(screen.getByText("Review submitted!")).toBeInTheDocument();
    expect(screen.getByText("/tmp/review.json")).toBeInTheDocument();
    expect(screen.queryByText("Submit Review")).not.toBeInTheDocument();
  });

  it("shows screenshot count when comment has screenshots", () => {
    const files = [makeFile()];
    const comments = new Map<string, Comment[]>([
      [
        "/root/README.md",
        [
          makeComment({
            screenshots: [makeScreenshotFile("s1.png")],
          }),
        ],
      ],
    ]);

    render(
      <ReviewSidebar
        files={files}
        comments={comments}
        onScrollToComment={vi.fn()}
        onSubmit={vi.fn()}
        submitted={false}
        outputPath={null}
      />,
    );

    expect(screen.getByText("1 screenshot")).toBeInTheDocument();
  });
});
