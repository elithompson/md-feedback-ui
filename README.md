# plan-reviewer

Browser-based markdown review UI with inline commenting and screenshot support. Designed for reviewing plans, specs, and documentation — especially with [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

## Features

- GitHub-flavored Markdown rendering with Mermaid diagram support
- Inline block-level commenting on any markdown element
- Screenshot attachments via paste or drag-and-drop
- Multi-file tabs with speckit ordering (spec, plan, tasks, then alphabetical)
- Structured JSON output (`.review.json`) for automation
- Zero-config: `npx` and go

## Quick Start

```bash
npx plan-reviewer ./docs/plan.md
```

This opens a browser-based review UI. Add comments inline, attach screenshots, and click Submit. The tool writes a `.review.json` file next to the input and exits.

## Claude Code Integration

Install the skill so Claude Code can launch reviews:

```bash
# Add to current project
npx plan-reviewer --install-skill

# Or add globally (all projects)
npx plan-reviewer --install-skill --global
```

Then in Claude Code, use the skill:

```
/plan-review path/to/plan.md
```

**Workflow:**
1. Claude launches the review server
2. You review and comment in the browser, then submit
3. The server writes `.review.json` and exits
4. Claude reads the structured feedback and addresses each comment

## CLI Reference

```
plan-reviewer <file-or-directory...> [options]
plan-reviewer --install-skill [--global]
```

| Option | Description |
|--------|-------------|
| `--no-open` | Don't auto-open the browser |
| `--install-skill` | Install the Claude Code skill to `.claude/commands/` |
| `--global` | With `--install-skill`, install to `~/.claude/commands/` |
| `--version` | Show version number |
| `--help` | Show help |

### Examples

```bash
plan-reviewer plan.md                    # Single file
plan-reviewer docs/                      # All .md files in directory
plan-reviewer spec.md plan.md tasks.md   # Multiple files
```

## Output Format

The `.review.json` file contains structured feedback:

```json
{
  "reviewedFiles": ["spec.md", "plan.md"],
  "submittedAt": "2026-03-29T12:00:00.000Z",
  "comments": [
    {
      "file": "plan.md",
      "startLine": 10,
      "endLine": 14,
      "blockType": "paragraph",
      "selectedText": "The text of the block being commented on",
      "comment": "This needs more detail about error handling",
      "screenshots": ["path/to/screenshot.png"]
    }
  ]
}
```

## Development

```bash
git clone https://github.com/elithompson/plan-reviewer.git
cd plan-reviewer
npm install

# Start dev servers (Vite frontend + Express API)
npm run dev                    # In one terminal
npx tsx src/server/index.ts test-fixtures/ --no-open  # In another

# Run checks
npm run check                  # typecheck + lint + test
```

## Requirements

Node.js >= 18.0.0

## License

MIT
