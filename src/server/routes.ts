import * as fs from "node:fs";
import * as path from "node:path";
import type { Express } from "express";
import type { Server } from "node:http";
import multer from "multer";
import type { ResolvedFile } from "./resolve-files.js";

interface ReviewComment {
  file: string;
  startLine: number;
  endLine: number;
  blockType: string;
  selectedText: string;
  comment: string;
  screenshots: string[];
}

interface ReviewPayload {
  reviewedFiles: string[];
  submittedAt: string;
  comments: ReviewComment[];
}

export function registerRoutes(
  app: Express,
  files: ResolvedFile[],
  outputDir: string,
  server: Server,
): void {
  const imageDir = path.join(outputDir, ".review-images");
  const upload = multer({ dest: imageDir });

  app.get("/api/files", (_req, res) => {
    res.json({ files });
  });

  app.post("/api/submit", upload.any(), (req, res) => {
    const reviewJson = (req as unknown as { body: Record<string, string> }).body
      .review;
    if (!reviewJson) {
      res.status(400).json({ error: "Missing review field" });
      return;
    }

    let review: ReviewPayload;
    try {
      review = JSON.parse(reviewJson) as ReviewPayload;
    } catch {
      res.status(400).json({ error: "Invalid JSON in review field" });
      return;
    }

    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    // Map uploaded files back to their comments.
    // Field names follow the pattern "screenshot_<commentIndex>".
    const uploadedFiles =
      (req as unknown as { files?: Array<{ fieldname: string; path: string }> })
        .files ?? [];

    for (const file of uploadedFiles) {
      const match = file.fieldname.match(/^screenshot_(\d+)$/);
      if (!match) continue;
      const commentIndex = Number(match[1]);
      if (commentIndex < review.comments.length) {
        review.comments[commentIndex].screenshots.push(file.path);
      }
    }

    const outputPath = path.join(outputDir, ".review.json");
    fs.writeFileSync(outputPath, JSON.stringify(review, null, 2));

    res.json({ success: true, outputPath });

    setTimeout(() => {
      server.close(() => {
        process.exit(0);
      });
    }, 500);
  });
}
