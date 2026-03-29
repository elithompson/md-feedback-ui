import { useCallback, useState } from "react";
import type { BlockSelection } from "../types";

export function useBlockSelection(): {
  selection: BlockSelection | null;
  selectBlock: (block: BlockSelection) => void;
  clearSelection: () => void;
} {
  const [selection, setSelection] = useState<BlockSelection | null>(null);

  const selectBlock = useCallback((block: BlockSelection) => {
    setSelection((prev) => {
      if (
        prev !== null &&
        prev.startLine === block.startLine &&
        prev.endLine === block.endLine
      ) {
        return null;
      }
      return block;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  return { selection, selectBlock, clearSelection };
}
