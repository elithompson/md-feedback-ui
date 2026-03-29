import { describe, it, expect } from "vitest";
import { formatLineLabel } from "../format-line-label";

describe("formatLineLabel", () => {
  it("returns single line label when start equals end", () => {
    expect(formatLineLabel(5, 5)).toBe("Line 5");
  });

  it("returns range label when start differs from end", () => {
    expect(formatLineLabel(5, 10)).toBe("Lines 5-10");
  });
});
