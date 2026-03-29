// @vitest-environment node
import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  parseArgs,
  getPackageVersion,
  installSkill,
  getSkillSourcePath,
} from "../cli.js";

const tmpDirs: string[] = [];

function createTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-test-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tmpDirs.length = 0;
});

describe("parseArgs", () => {
  it("separates flags from file arguments", () => {
    const { flags, fileArgs } = parseArgs([
      "plan.md",
      "--no-open",
      "spec.md",
      "--help",
    ]);

    expect(flags).toEqual(new Set(["--no-open", "--help"]));
    expect(fileArgs).toEqual(["plan.md", "spec.md"]);
  });

  it("returns empty sets for no arguments", () => {
    const { flags, fileArgs } = parseArgs([]);

    expect(flags.size).toBe(0);
    expect(fileArgs).toEqual([]);
  });

  it("handles flags only", () => {
    const { flags, fileArgs } = parseArgs(["--version"]);

    expect(flags).toEqual(new Set(["--version"]));
    expect(fileArgs).toEqual([]);
  });

  it("handles file args only", () => {
    const { flags, fileArgs } = parseArgs(["a.md", "b.md"]);

    expect(flags.size).toBe(0);
    expect(fileArgs).toEqual(["a.md", "b.md"]);
  });
});

describe("getPackageVersion", () => {
  it("returns a valid semver string", () => {
    const version = getPackageVersion();

    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe("installSkill", () => {
  it("copies the skill file to .claude/commands/ in the given directory", () => {
    const dir = createTmpDir();

    installSkill(dir, false);

    const targetPath = path.join(dir, ".claude", "commands", "plan-review.md");
    expect(fs.existsSync(targetPath)).toBe(true);

    const content = fs.readFileSync(targetPath, "utf-8");
    expect(content).toContain("npx md-feedback-ui");
  });

  it("skips if the skill file already exists", () => {
    const dir = createTmpDir();
    const targetDir = path.join(dir, ".claude", "commands");
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(
      path.join(targetDir, "plan-review.md"),
      "existing content",
    );

    installSkill(dir, false);

    // Should not overwrite
    const content = fs.readFileSync(
      path.join(targetDir, "plan-review.md"),
      "utf-8",
    );
    expect(content).toBe("existing content");
  });

  it("installs to ~/.claude/commands/ when global is true", () => {
    // We can't test writing to the actual home directory, but we can verify
    // the function uses HOME env var by setting it to a temp dir
    const dir = createTmpDir();
    const originalHome = process.env.HOME;
    process.env.HOME = dir;

    try {
      installSkill(dir, true);

      const targetPath = path.join(
        dir,
        ".claude",
        "commands",
        "plan-review.md",
      );
      expect(fs.existsSync(targetPath)).toBe(true);
    } finally {
      process.env.HOME = originalHome;
    }
  });
});

describe("getSkillSourcePath", () => {
  it("points to a file that exists", () => {
    const sourcePath = getSkillSourcePath();

    expect(fs.existsSync(sourcePath)).toBe(true);
  });
});
