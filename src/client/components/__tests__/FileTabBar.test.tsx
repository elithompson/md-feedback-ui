import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileTabBar } from "../FileTabBar";
import type { ReviewFile } from "../../types";

function makeFile(relativePath: string): ReviewFile {
  return {
    path: `/root/${relativePath}`,
    relativePath,
    content: "# Hello",
    lines: ["# Hello"],
  };
}

const files: ReviewFile[] = [
  makeFile("README.md"),
  makeFile("docs/guide.md"),
  makeFile("CHANGELOG.md"),
];

describe("FileTabBar", () => {
  it("renders one tab per file with correct filename labels", () => {
    render(
      <FileTabBar
        files={files}
        activeIndex={0}
        commentCounts={new Map()}
        onTabChange={() => {}}
      />,
    );

    expect(screen.getByText("README.md")).toBeInTheDocument();
    expect(screen.getByText("docs/guide.md")).toBeInTheDocument();
    expect(screen.getByText("CHANGELOG.md")).toBeInTheDocument();
  });

  it("active tab has tab--active class", () => {
    render(
      <FileTabBar
        files={files}
        activeIndex={1}
        commentCounts={new Map()}
        onTabChange={() => {}}
      />,
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).not.toHaveClass("tab--active");
    expect(tabs[1]).toHaveClass("tab--active");
    expect(tabs[2]).not.toHaveClass("tab--active");
  });

  it("clicking inactive tab calls onTabChange with correct index", async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FileTabBar
        files={files}
        activeIndex={0}
        commentCounts={new Map()}
        onTabChange={onTabChange}
      />,
    );

    await user.click(screen.getByText("CHANGELOG.md"));
    expect(onTabChange).toHaveBeenCalledWith(2);
  });

  it("shows comment count badge when file has comments > 0", () => {
    const counts = new Map<string, number>([
      ["/root/README.md", 3],
      ["/root/docs/guide.md", 1],
    ]);

    render(
      <FileTabBar
        files={files}
        activeIndex={0}
        commentCounts={counts}
        onTabChange={() => {}}
      />,
    );

    const badges = document.querySelectorAll(".tab__badge");
    expect(badges).toHaveLength(2);
    expect(badges[0].textContent).toBe("3");
    expect(badges[1].textContent).toBe("1");
  });

  it("hides badge when file has 0 comments", () => {
    const counts = new Map<string, number>([["/root/README.md", 0]]);

    render(
      <FileTabBar
        files={files}
        activeIndex={0}
        commentCounts={counts}
        onTabChange={() => {}}
      />,
    );

    const tabs = screen.getAllByRole("tab");
    // CHANGELOG.md tab has no entry; README.md has 0 — neither should show badge
    for (const tab of tabs) {
      expect(tab.querySelector(".tab__badge")).toBeNull();
    }
  });
});
