import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MermaidBlock } from "../MermaidBlock";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg>diagram</svg>" }),
  },
}));

describe("MermaidBlock", () => {
  it("renders a container with mermaid-diagram class", () => {
    const { container } = render(<MermaidBlock code="graph TD; A-->B" />);
    expect(container.querySelector(".mermaid-diagram")).toBeInTheDocument();
  });
});
