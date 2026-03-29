import { createElement, useEffect, useRef, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Root, RootContent } from "mdast";
import type { Comment, ActiveCommentForm } from "../types";
import { CommentForm } from "./CommentForm";
import { CommentThread } from "./CommentThread";

interface MarkdownRendererProps {
  content: string;
  comments: Comment[];
  activeForm: ActiveCommentForm | null;
  onAddComment: (block: {
    startLine: number;
    endLine: number;
    blockType: string;
    selectedText: string;
  }) => void;
  onCommentSubmit: (text: string, screenshots?: File[]) => void;
  onCommentCancel: () => void;
  onEditComment: (id: string) => void;
  onDeleteComment: (id: string) => void;
}

// Block-level node types that we want to make commentable
const BLOCK_TYPES = new Set([
  "heading",
  "paragraph",
  "code",
  "blockquote",
  "list",
  "listItem",
  "table",
]);

/**
 * Custom remark plugin that annotates block-level AST nodes with
 * data-startLine and data-endLine hProperties. react-markdown passes
 * these through as HTML data attributes.
 */
function remarkPositionPlugin() {
  return (tree: Root) => {
    visit(tree, (node: Root | RootContent) => {
      if (!BLOCK_TYPES.has(node.type)) return;
      if (!node.position) return;

      const data = (node.data ??= {});
      const hProperties = ((data as Record<string, unknown>).hProperties ??=
        {}) as Record<string, unknown>;

      hProperties["data-startline"] = node.position.start.line;
      hProperties["data-endline"] = node.position.end.line;
      hProperties["data-blocktype"] = node.type;
    });
  };
}

/**
 * Extracts text content from React children recursively.
 */
function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return extractText(
      (children as { props: { children?: ReactNode } }).props.children,
    );
  }
  return "";
}

/**
 * Wrapper that makes a block-level element commentable.
 */
function CommentableBlock({
  startLine,
  endLine,
  blockType,
  selectedText,
  comments,
  activeForm,
  onAddComment,
  onCommentSubmit,
  onCommentCancel,
  onEditComment,
  onDeleteComment,
  children,
}: {
  startLine: number;
  endLine: number;
  blockType: string;
  selectedText: string;
  comments: Comment[];
  activeForm: ActiveCommentForm | null;
  onAddComment: MarkdownRendererProps["onAddComment"];
  onCommentSubmit: MarkdownRendererProps["onCommentSubmit"];
  onCommentCancel: MarkdownRendererProps["onCommentCancel"];
  onEditComment: MarkdownRendererProps["onEditComment"];
  onDeleteComment: MarkdownRendererProps["onDeleteComment"];
  children: ReactNode;
}) {
  const matchingComments = comments.filter(
    (c) => c.startLine === startLine && c.endLine === endLine,
  );

  const formActive =
    activeForm &&
    activeForm.startLine === startLine &&
    activeForm.endLine === endLine;

  return (
    <div
      className="commentable-block"
      data-start-line={startLine}
      data-end-line={endLine}
      data-block-type={blockType}
    >
      <button
        className="add-comment-btn"
        onClick={() =>
          onAddComment({ startLine, endLine, blockType, selectedText })
        }
      >
        +
      </button>
      {children}
      {matchingComments.map((comment) => (
        <CommentThread
          key={comment.id}
          comment={comment}
          onEdit={onEditComment}
          onDelete={onDeleteComment}
        />
      ))}
      {formActive && (
        <CommentForm
          startLine={startLine}
          endLine={endLine}
          blockType={blockType}
          onSubmit={onCommentSubmit}
          onCancel={onCommentCancel}
          initialText={activeForm?.editingId ? undefined : undefined}
        />
      )}
    </div>
  );
}

/**
 * MermaidBlock renders mermaid diagram SVG.
 */
function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderMermaid() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false });
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.textContent = "Mermaid rendering failed";
        }
      }
    }

    renderMermaid();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return <div ref={containerRef} className="mermaid-diagram" />;
}

/**
 * Creates a wrapper component for a given HTML tag that extracts position
 * data attributes injected by remarkPositionPlugin and wraps the element
 * in a CommentableBlock.
 */
function makeBlockComponent(
  tag: string,
  blockTypeOverride: string | null,
  comments: Comment[],
  activeForm: ActiveCommentForm | null,
  onAddComment: MarkdownRendererProps["onAddComment"],
  onCommentSubmit: MarkdownRendererProps["onCommentSubmit"],
  onCommentCancel: MarkdownRendererProps["onCommentCancel"],
  onEditComment: MarkdownRendererProps["onEditComment"],
  onDeleteComment: MarkdownRendererProps["onDeleteComment"],
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function BlockComponent(props: any) {
    const startLine = Number(props["data-startline"]) || 0;
    const endLine = Number(props["data-endline"]) || 0;
    const blockType =
      blockTypeOverride ??
      (props["data-blocktype"] as string) ??
      tag;

    if (!startLine) {
      // No position data — render plain element (nested elements without position)
      return createElement(tag, stripDataProps(props));
    }

    const selectedText = extractText(props.children);

    return (
      <CommentableBlock
        startLine={startLine}
        endLine={endLine}
        blockType={blockType}
        selectedText={selectedText}
        comments={comments}
        activeForm={activeForm}
        onAddComment={onAddComment}
        onCommentSubmit={onCommentSubmit}
        onCommentCancel={onCommentCancel}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
      >
        {renderInnerElement(tag, props)}
      </CommentableBlock>
    );
  };
}

function stripDataProps(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      !key.startsWith("data-startline") &&
      !key.startsWith("data-endline") &&
      !key.startsWith("data-blocktype") &&
      key !== "node"
    ) {
      result[key] = value;
    }
  }
  return result;
}

function renderInnerElement(
  tag: string,
  props: Record<string, unknown>,
): ReactNode {
  return createElement(tag, stripDataProps(props));
}

/**
 * Custom pre component that handles mermaid code blocks specially.
 */
function makePreComponent(
  comments: Comment[],
  activeForm: ActiveCommentForm | null,
  onAddComment: MarkdownRendererProps["onAddComment"],
  onCommentSubmit: MarkdownRendererProps["onCommentSubmit"],
  onCommentCancel: MarkdownRendererProps["onCommentCancel"],
  onEditComment: MarkdownRendererProps["onEditComment"],
  onDeleteComment: MarkdownRendererProps["onDeleteComment"],
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function PreComponent(props: any) {
    // Check if child is a code element — position data lives on the code child
    const child = Array.isArray(props.children)
      ? props.children[0]
      : props.children;

    // hProperties from the code AST node end up on the code element's props
    const childProps = child?.props ?? {};
    const startLine =
      Number(props["data-startline"]) ||
      Number(childProps["data-startline"]) ||
      0;
    const endLine =
      Number(props["data-endline"]) ||
      Number(childProps["data-endline"]) ||
      0;
    const blockType =
      (props["data-blocktype"] as string) ??
      (childProps["data-blocktype"] as string) ??
      "code";

    const isMermaid =
      childProps.className === "language-mermaid" ||
      childProps.className?.includes("language-mermaid");

    if (isMermaid && startLine) {
      const mermaidCode = extractText(childProps.children);

      return (
        <CommentableBlock
          startLine={startLine}
          endLine={endLine}
          blockType="mermaid"
          selectedText={mermaidCode}
          comments={comments}
          activeForm={activeForm}
          onAddComment={onAddComment}
          onCommentSubmit={onCommentSubmit}
          onCommentCancel={onCommentCancel}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
        >
          <MermaidBlock code={mermaidCode} />
        </CommentableBlock>
      );
    }

    if (!startLine) {
      return <pre {...stripDataProps(props)} />;
    }

    const selectedText = extractText(props.children);

    return (
      <CommentableBlock
        startLine={startLine}
        endLine={endLine}
        blockType={blockType}
        selectedText={selectedText}
        comments={comments}
        activeForm={activeForm}
        onAddComment={onAddComment}
        onCommentSubmit={onCommentSubmit}
        onCommentCancel={onCommentCancel}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
      >
        <pre {...stripDataProps(props)} />
      </CommentableBlock>
    );
  };
}

export function MarkdownRenderer({
  content,
  comments,
  activeForm,
  onAddComment,
  onCommentSubmit,
  onCommentCancel,
  onEditComment,
  onDeleteComment,
}: MarkdownRendererProps) {
  const components = {
    h1: makeBlockComponent(
      "h1",
      "heading",
      comments,
      activeForm,
      onAddComment,
      onCommentSubmit,
      onCommentCancel,
      onEditComment,
      onDeleteComment,
    ),
    h2: makeBlockComponent(
      "h2",
      "heading",
      comments,
      activeForm,
      onAddComment,
      onCommentSubmit,
      onCommentCancel,
      onEditComment,
      onDeleteComment,
    ),
    h3: makeBlockComponent(
      "h3",
      "heading",
      comments,
      activeForm,
      onAddComment,
      onCommentSubmit,
      onCommentCancel,
      onEditComment,
      onDeleteComment,
    ),
    h4: makeBlockComponent(
      "h4",
      "heading",
      comments,
      activeForm,
      onAddComment,
      onCommentSubmit,
      onCommentCancel,
      onEditComment,
      onDeleteComment,
    ),
    h5: makeBlockComponent(
      "h5",
      "heading",
      comments,
      activeForm,
      onAddComment,
      onCommentSubmit,
      onCommentCancel,
      onEditComment,
      onDeleteComment,
    ),
    h6: makeBlockComponent(
      "h6",
      "heading",
      comments,
      activeForm,
      onAddComment,
      onCommentSubmit,
      onCommentCancel,
      onEditComment,
      onDeleteComment,
    ),
    p: makeBlockComponent(
      "p",
      "paragraph",
      comments,
      activeForm,
      onAddComment,
      onCommentSubmit,
      onCommentCancel,
      onEditComment,
      onDeleteComment,
    ),
    blockquote: makeBlockComponent(
      "blockquote",
      "blockquote",
      comments,
      activeForm,
      onAddComment,
      onCommentSubmit,
      onCommentCancel,
      onEditComment,
      onDeleteComment,
    ),
    table: makeBlockComponent(
      "table",
      "table",
      comments,
      activeForm,
      onAddComment,
      onCommentSubmit,
      onCommentCancel,
      onEditComment,
      onDeleteComment,
    ),
    li: makeBlockComponent(
      "li",
      "listItem",
      comments,
      activeForm,
      onAddComment,
      onCommentSubmit,
      onCommentCancel,
      onEditComment,
      onDeleteComment,
    ),
    pre: makePreComponent(
      comments,
      activeForm,
      onAddComment,
      onCommentSubmit,
      onCommentCancel,
      onEditComment,
      onDeleteComment,
    ),
  };

  return (
    <div className="markdown-renderer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkPositionPlugin]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
