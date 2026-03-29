#!/usr/bin/env node
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import open from "open";
import { resolveFiles } from "./resolve-files.js";
import { registerRoutes } from "./routes.js";

const args = process.argv.slice(2);

const files = resolveFiles(args);

// Determine outputDir: if input was a directory, use it; otherwise use the
// directory of the first file.
const firstArg = path.resolve(args[0]);
const outputDir = fs.statSync(firstArg).isDirectory()
  ? firstArg
  : path.dirname(files[0].path);

const app = express();
app.use(cors());
app.use(express.json());

// Serve the built client if it exists
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.resolve(__dirname, "../client");
if (fs.existsSync(clientDir)) {
  app.use(express.static(clientDir));
}

const server = app.listen(3456);

server.on("listening", () => {
  const url = "http://localhost:3456";
  console.log(`Plan reviewer running at ${url}`);
  if (!args.includes("--no-open")) {
    open(url);
  }
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      "Error: port 3456 is already in use.\n" +
        "A previous plan-reviewer may still be running. Kill it with:\n" +
        "  kill $(lsof -ti :3456)",
    );
    process.exit(1);
  }
  throw err;
});

registerRoutes(app, files, outputDir, server);
