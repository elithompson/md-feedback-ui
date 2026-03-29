// @vitest-environment node
import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root, RootContent } from "mdast";
import { remarkPositionPlugin } from "../remark-position-plugin";

function getHProperties(node: Root | RootContent): Record<string, unknown> {
  return ((node.data as Record<string, unknown>)?.hProperties ??
    {}) as Record<string, unknown>;
}

// The plugin runs as a transform, not at parse time. We need to run it.
function transformWithPlugin(markdown: string): Root {
  const processor = unified().use(remarkParse).use(remarkPositionPlugin);
  const tree = processor.parse(markdown);
  return processor.runSync(tree) as Root;
}

describe("remarkPositionPlugin", () => {
  it("annotates heading nodes with position data", () => {
    const tree = transformWithPlugin("# Hello");

    const heading = tree.children[0];
    const props = getHProperties(heading);

    expect(props["data-startline"]).toBe(1);
    expect(props["data-endline"]).toBe(1);
    expect(props["data-blocktype"]).toBe("heading");
  });

  it("annotates paragraph nodes with position data", () => {
    const tree = transformWithPlugin("Some text");

    const paragraph = tree.children[0];
    const props = getHProperties(paragraph);

    expect(props["data-startline"]).toBe(1);
    expect(props["data-endline"]).toBe(1);
    expect(props["data-blocktype"]).toBe("paragraph");
  });

  it("does not annotate non-block nodes like emphasis", () => {
    const tree = transformWithPlugin("*emphasized*");

    // The paragraph is annotated, but the emphasis child is not
    const paragraph = tree.children[0];
    expect(getHProperties(paragraph)["data-blocktype"]).toBe("paragraph");

    const emphasis = (paragraph as { children: RootContent[] }).children[0];
    expect(emphasis.data).toBeUndefined();
  });

  it("annotates list items", () => {
    const tree = transformWithPlugin("- item one\n- item two");

    const list = tree.children[0];
    const listItem = (list as { children: RootContent[] }).children[0];
    const props = getHProperties(listItem);

    expect(props["data-startline"]).toBe(1);
    expect(props["data-blocktype"]).toBe("listItem");
  });
});
