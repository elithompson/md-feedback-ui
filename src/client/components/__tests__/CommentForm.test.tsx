import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentForm } from "../CommentForm";

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
  URL.revokeObjectURL = vi.fn();
});

const defaultProps = {
  startLine: 5,
  endLine: 8,
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe("CommentForm", () => {
  it("renders textarea that auto-focuses on mount", () => {
    render(<CommentForm {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
    expect(document.activeElement).toBe(textarea);
  });

  it("clicking 'Add comment' calls onSubmit with textarea value and empty screenshots array", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox"), "Great work!");
    await user.click(screen.getByText("Add comment"));

    expect(onSubmit).toHaveBeenCalledWith("Great work!", []);
  });

  it("clicking 'Cancel' calls onCancel", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(<CommentForm {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("Cmd+Enter keydown on textarea calls onSubmit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "keyboard submit");

    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

    expect(onSubmit).toHaveBeenCalledWith("keyboard submit", []);
  });

  it("Escape keydown on textarea calls onCancel", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(<CommentForm {...defaultProps} onCancel={onCancel} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "something");

    fireEvent.keyDown(textarea, { key: "Escape" });

    expect(onCancel).toHaveBeenCalled();
  });

  it("submit button is disabled when textarea is empty", () => {
    render(<CommentForm {...defaultProps} />);
    const submitBtn = screen.getByText("Add comment");
    expect(submitBtn).toBeDisabled();
  });

  it("when initialText prop provided, textarea pre-fills with that text", () => {
    render(<CommentForm {...defaultProps} initialText="Edit me" />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Edit me");
  });

  it('renders line range header "Lines 5-8" for multi-line', () => {
    render(<CommentForm {...defaultProps} startLine={5} endLine={8} />);
    expect(screen.getByText("Lines 5-8")).toBeInTheDocument();
  });

  it('renders "Line 5" for single-line', () => {
    render(<CommentForm {...defaultProps} startLine={5} endLine={5} />);
    expect(screen.getByText("Line 5")).toBeInTheDocument();
  });

  it("pasting an image adds a thumbnail preview", () => {
    render(<CommentForm {...defaultProps} />);
    const textarea = screen.getByRole("textbox");

    const file = new File(["fake-png"], "screenshot.png", {
      type: "image/png",
    });

    const pasteEvent = new Event("paste", { bubbles: true }) as Event & {
      clipboardData: { items: Array<{ kind: string; type: string; getAsFile: () => File }> };
    };

    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        items: [
          {
            kind: "file",
            type: "image/png",
            getAsFile: () => file,
          },
        ],
      },
    });

    fireEvent(textarea, pasteEvent);

    const thumbnails = document.querySelectorAll(".comment-form__thumbnail");
    expect(thumbnails).toHaveLength(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
  });

  it('clicking "x" on thumbnail removes it from the preview list', () => {
    render(<CommentForm {...defaultProps} />);
    const textarea = screen.getByRole("textbox");

    const file = new File(["fake-png"], "screenshot.png", {
      type: "image/png",
    });

    const pasteEvent = new Event("paste", { bubbles: true }) as Event & {
      clipboardData: { items: Array<{ kind: string; type: string; getAsFile: () => File }> };
    };

    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        items: [
          {
            kind: "file",
            type: "image/png",
            getAsFile: () => file,
          },
        ],
      },
    });

    fireEvent(textarea, pasteEvent);

    const removeBtn = document.querySelector(
      ".comment-form__thumbnail button",
    ) as HTMLElement;
    fireEvent.click(removeBtn);

    const thumbnails = document.querySelectorAll(".comment-form__thumbnail");
    expect(thumbnails).toHaveLength(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("dropping an image file adds a thumbnail preview", () => {
    render(<CommentForm {...defaultProps} />);
    const form = document.querySelector(".comment-form") as HTMLElement;

    const file = new File(["fake-png"], "dropped.png", {
      type: "image/png",
    });

    const dataTransfer = {
      files: [file],
      types: ["Files"],
    };

    fireEvent.drop(form, { dataTransfer });

    const thumbnails = document.querySelectorAll(".comment-form__thumbnail");
    expect(thumbnails).toHaveLength(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
  });
});
