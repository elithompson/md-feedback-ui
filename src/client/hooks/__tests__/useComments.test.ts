import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useComments } from "../useComments";

describe("useComments", () => {
  const formA = {
    filePath: "fileA.md",
    startLine: 1,
    endLine: 3,
    blockType: "paragraph",
    selectedText: "some text",
  };

  const formB = {
    filePath: "fileB.md",
    startLine: 10,
    endLine: 12,
    blockType: "code",
    selectedText: "code block",
  };

  it("showCommentForm sets activeForm", () => {
    const { result } = renderHook(() => useComments());

    act(() => {
      result.current.showCommentForm(formA);
    });

    expect(result.current.activeForm).toEqual(formA);
  });

  it("cancelComment clears activeForm to null", () => {
    const { result } = renderHook(() => useComments());

    act(() => {
      result.current.showCommentForm(formA);
    });
    expect(result.current.activeForm).not.toBeNull();

    act(() => {
      result.current.cancelComment();
    });
    expect(result.current.activeForm).toBeNull();
  });

  it("addComment creates comment with id and correct fields", () => {
    const { result } = renderHook(() => useComments());

    act(() => {
      result.current.showCommentForm(formA);
    });

    act(() => {
      result.current.addComment("Great section!");
    });

    const comments = result.current.getCommentsForFile("fileA.md");
    expect(comments).toHaveLength(1);

    const comment = comments[0];
    expect(comment.id).toBeTruthy();
    expect(comment.filePath).toBe("fileA.md");
    expect(comment.startLine).toBe(1);
    expect(comment.endLine).toBe(3);
    expect(comment.blockType).toBe("paragraph");
    expect(comment.selectedText).toBe("some text");
    expect(comment.comment).toBe("Great section!");
    expect(comment.screenshots).toEqual([]);
  });

  it("addComment clears activeForm", () => {
    const { result } = renderHook(() => useComments());

    act(() => {
      result.current.showCommentForm(formA);
    });
    act(() => {
      result.current.addComment("A comment");
    });

    expect(result.current.activeForm).toBeNull();
  });

  it("addComment with screenshots attaches them", () => {
    const { result } = renderHook(() => useComments());
    const fakeFile = new File(["img"], "screenshot.png", {
      type: "image/png",
    });

    act(() => {
      result.current.showCommentForm(formA);
    });
    act(() => {
      result.current.addComment("With image", [fakeFile]);
    });

    const comments = result.current.getCommentsForFile("fileA.md");
    expect(comments[0].screenshots).toHaveLength(1);
    expect(comments[0].screenshots[0].name).toBe("screenshot.png");
  });

  it("deleteComment removes by id, leaves others intact", () => {
    const { result } = renderHook(() => useComments());

    act(() => {
      result.current.showCommentForm(formA);
    });
    act(() => {
      result.current.addComment("First");
    });
    act(() => {
      result.current.showCommentForm(formA);
    });
    act(() => {
      result.current.addComment("Second");
    });

    const before = result.current.getCommentsForFile("fileA.md");
    expect(before).toHaveLength(2);
    const idToDelete = before[0].id;

    act(() => {
      result.current.deleteComment("fileA.md", idToDelete);
    });

    const after = result.current.getCommentsForFile("fileA.md");
    expect(after).toHaveLength(1);
    expect(after[0].comment).toBe("Second");
  });

  it("editComment updates text, preserves other fields", () => {
    const { result } = renderHook(() => useComments());

    act(() => {
      result.current.showCommentForm(formA);
    });
    act(() => {
      result.current.addComment("Original text");
    });

    const id = result.current.getCommentsForFile("fileA.md")[0].id;

    act(() => {
      result.current.editComment(id, "Updated text");
    });

    const comment = result.current.getCommentsForFile("fileA.md")[0];
    expect(comment.comment).toBe("Updated text");
    expect(comment.id).toBe(id);
    expect(comment.filePath).toBe("fileA.md");
    expect(comment.startLine).toBe(1);
  });

  it("comments keyed by filePath - adding to file A does not affect file B", () => {
    const { result } = renderHook(() => useComments());

    act(() => {
      result.current.showCommentForm(formA);
    });
    act(() => {
      result.current.addComment("Comment on A");
    });
    act(() => {
      result.current.showCommentForm(formB);
    });
    act(() => {
      result.current.addComment("Comment on B");
    });

    expect(result.current.getCommentsForFile("fileA.md")).toHaveLength(1);
    expect(result.current.getCommentsForFile("fileB.md")).toHaveLength(1);
    expect(result.current.getCommentsForFile("fileA.md")[0].comment).toBe(
      "Comment on A",
    );
    expect(result.current.getCommentsForFile("fileB.md")[0].comment).toBe(
      "Comment on B",
    );
  });

  it("getCommentsForFile returns only that file's comments", () => {
    const { result } = renderHook(() => useComments());

    act(() => {
      result.current.showCommentForm(formA);
    });
    act(() => {
      result.current.addComment("A1");
    });
    act(() => {
      result.current.showCommentForm(formA);
    });
    act(() => {
      result.current.addComment("A2");
    });
    act(() => {
      result.current.showCommentForm(formB);
    });
    act(() => {
      result.current.addComment("B1");
    });

    const fileAComments = result.current.getCommentsForFile("fileA.md");
    expect(fileAComments).toHaveLength(2);
    expect(fileAComments.every((c) => c.filePath === "fileA.md")).toBe(true);
  });

  it("getCommentCount returns total across all files", () => {
    const { result } = renderHook(() => useComments());

    expect(result.current.getCommentCount()).toBe(0);

    act(() => {
      result.current.showCommentForm(formA);
    });
    act(() => {
      result.current.addComment("A1");
    });
    act(() => {
      result.current.showCommentForm(formB);
    });
    act(() => {
      result.current.addComment("B1");
    });

    expect(result.current.getCommentCount()).toBe(2);
  });

  it("getCommentsForFile returns empty array for unknown file", () => {
    const { result } = renderHook(() => useComments());
    expect(result.current.getCommentsForFile("nonexistent.md")).toEqual([]);
  });

  it("startEditing sets activeForm with editingId", () => {
    const { result } = renderHook(() => useComments());

    act(() => {
      result.current.showCommentForm(formA);
    });
    act(() => {
      result.current.addComment("To edit");
    });

    const comment = result.current.getCommentsForFile("fileA.md")[0];

    act(() => {
      result.current.startEditing("fileA.md", comment.id);
    });

    expect(result.current.activeForm).toEqual({
      filePath: "fileA.md",
      startLine: 1,
      endLine: 3,
      blockType: "paragraph",
      selectedText: "some text",
      editingId: comment.id,
    });
  });

  it("addComment when activeForm has editingId updates instead of creating", () => {
    const { result } = renderHook(() => useComments());

    act(() => {
      result.current.showCommentForm(formA);
    });
    act(() => {
      result.current.addComment("Original");
    });

    const comment = result.current.getCommentsForFile("fileA.md")[0];

    act(() => {
      result.current.startEditing("fileA.md", comment.id);
    });
    act(() => {
      result.current.addComment("Edited via form");
    });

    const comments = result.current.getCommentsForFile("fileA.md");
    expect(comments).toHaveLength(1);
    expect(comments[0].comment).toBe("Edited via form");
    expect(comments[0].id).toBe(comment.id);
    expect(result.current.activeForm).toBeNull();
  });
});
