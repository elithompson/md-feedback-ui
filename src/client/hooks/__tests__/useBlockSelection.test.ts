import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBlockSelection } from "../useBlockSelection";
import type { BlockSelection } from "../../types";

describe("useBlockSelection", () => {
  const block: BlockSelection = {
    startLine: 1,
    endLine: 3,
    blockType: "paragraph",
  };

  const differentBlock: BlockSelection = {
    startLine: 5,
    endLine: 8,
    blockType: "code",
  };

  it("starts with null selection", () => {
    const { result } = renderHook(() => useBlockSelection());
    expect(result.current.selection).toBeNull();
  });

  it("selectBlock sets selection to the provided block", () => {
    const { result } = renderHook(() => useBlockSelection());

    act(() => {
      result.current.selectBlock(block);
    });

    expect(result.current.selection).toEqual(block);
  });

  it("selectBlock same block again deselects (null)", () => {
    const { result } = renderHook(() => useBlockSelection());

    act(() => {
      result.current.selectBlock(block);
    });
    expect(result.current.selection).toEqual(block);

    act(() => {
      result.current.selectBlock(block);
    });
    expect(result.current.selection).toBeNull();
  });

  it("selectBlock different block replaces selection", () => {
    const { result } = renderHook(() => useBlockSelection());

    act(() => {
      result.current.selectBlock(block);
    });
    expect(result.current.selection).toEqual(block);

    act(() => {
      result.current.selectBlock(differentBlock);
    });
    expect(result.current.selection).toEqual(differentBlock);
  });

  it("clearSelection resets to null", () => {
    const { result } = renderHook(() => useBlockSelection());

    act(() => {
      result.current.selectBlock(block);
    });
    expect(result.current.selection).toEqual(block);

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selection).toBeNull();
  });
});
