import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { useReviewFiles } from "../useReviewFiles";

const mockFiles = [
  {
    path: "/abs/path/README.md",
    relativePath: "README.md",
    content: "# Hello\n\nWorld\nLine 3",
  },
  {
    path: "/abs/path/docs/guide.md",
    relativePath: "docs/guide.md",
    content: "Single line",
  },
];

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("useReviewFiles", () => {
  it("sets loading true during fetch, then false after", async () => {
    server.use(
      http.get("/api/files", () => HttpResponse.json({ files: mockFiles })),
    );

    const { result } = renderHook(() => useReviewFiles());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("fetches from /api/files on mount and parses response with split lines", async () => {
    server.use(
      http.get("/api/files", () => HttpResponse.json({ files: mockFiles })),
    );

    const { result } = renderHook(() => useReviewFiles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.files).toHaveLength(2);

    const first = result.current.files[0];
    expect(first.path).toBe("/abs/path/README.md");
    expect(first.relativePath).toBe("README.md");
    expect(first.content).toBe("# Hello\n\nWorld\nLine 3");
    expect(first.lines).toEqual(["# Hello", "", "World", "Line 3"]);

    const second = result.current.files[1];
    expect(second.lines).toEqual(["Single line"]);
  });

  it("sets error string on fetch failure", async () => {
    server.use(
      http.get("/api/files", () =>
        HttpResponse.json({ message: "Not found" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useReviewFiles());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch review files");
    expect(result.current.files).toEqual([]);
  });
});
