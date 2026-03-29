// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express from "express";
import http from "node:http";
import request from "supertest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { registerRoutes } from "../routes.js";
import type { ResolvedFile } from "../resolve-files.js";

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "routes-test-"));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function createApp(files: ResolvedFile[], outputDir?: string) {
  const app = express();
  app.use(express.json());
  const server = http.createServer(app);
  const dir = outputDir ?? tmpDir;

  // Mock process.exit and server.close so the test doesn't actually shut down
  const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
    return undefined as never;
  });
  const mockClose = vi.spyOn(server, "close").mockImplementation((cb) => {
    if (cb) cb();
    return server;
  });

  registerRoutes(app, files, dir, server);

  return { app, server, mockExit, mockClose, cleanup: () => {
    mockExit.mockRestore();
    mockClose.mockRestore();
  }};
}

describe("GET /api/files", () => {
  it("returns the files array with path, relativePath, and content", async () => {
    const files: ResolvedFile[] = [
      { path: "/tmp/spec.md", relativePath: "spec.md", content: "# Spec" },
      { path: "/tmp/plan.md", relativePath: "plan.md", content: "# Plan" },
    ];
    const { app, cleanup } = createApp(files);

    const res = await request(app).get("/api/files").expect(200);

    expect(res.body.files).toHaveLength(2);
    expect(res.body.files[0]).toEqual({
      path: "/tmp/spec.md",
      relativePath: "spec.md",
      content: "# Spec",
    });
    expect(res.body.files[1]).toEqual({
      path: "/tmp/plan.md",
      relativePath: "plan.md",
      content: "# Plan",
    });

    cleanup();
  });
});

describe("POST /api/submit", () => {
  it("writes .review.json and responds with success", async () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "submit-test-"));
    const files: ResolvedFile[] = [];
    const { app, cleanup } = createApp(files, outDir);

    const reviewPayload = {
      status: "approved",
      comments: [{ line: 1, text: "Looks good" }],
    };

    const res = await request(app)
      .post("/api/submit")
      .field("review", JSON.stringify(reviewPayload))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.outputPath).toBe(path.join(outDir, ".review.json"));

    // Verify the file was actually written
    const written = JSON.parse(
      fs.readFileSync(path.join(outDir, ".review.json"), "utf-8"),
    );
    expect(written).toEqual(reviewPayload);

    cleanup();
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it("written .review.json content matches submitted payload exactly", async () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "submit-test2-"));
    const files: ResolvedFile[] = [];
    const { app, cleanup } = createApp(files, outDir);

    const reviewPayload = {
      verdict: "changes-requested",
      sections: [
        { file: "spec.md", comments: ["Add error handling section"] },
      ],
    };

    await request(app)
      .post("/api/submit")
      .field("review", JSON.stringify(reviewPayload))
      .expect(200);

    const written = JSON.parse(
      fs.readFileSync(path.join(outDir, ".review.json"), "utf-8"),
    );
    expect(written).toEqual(reviewPayload);

    cleanup();
    fs.rmSync(outDir, { recursive: true, force: true });
  });
});
