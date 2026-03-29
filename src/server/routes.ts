import * as fs from "node:fs";
import * as path from "node:path";
import type { Express } from "express";
import type { Server } from "node:http";
import multer from "multer";
import type { ResolvedFile } from "./resolve-files.js";

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

    let review: unknown;
    try {
      review = JSON.parse(reviewJson);
    } catch {
      res.status(400).json({ error: "Invalid JSON in review field" });
      return;
    }

    const outputPath = path.join(outputDir, ".review.json");

    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(review, null, 2));

    res.json({ success: true, outputPath });

    setTimeout(() => {
      server.close(() => {
        process.exit(0);
      });
    }, 500);
  });
}
