import { useEffect, useState } from "react";
import type { ReviewFile } from "../types";

export function useReviewFiles(): {
  files: ReviewFile[];
  loading: boolean;
  error: string | null;
} {
  const [files, setFiles] = useState<ReviewFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchFiles() {
      try {
        const response = await fetch("/api/files");
        if (!response.ok) {
          throw new Error("Failed to fetch review files");
        }
        const json: { files: Array<{ path: string; relativePath: string; content: string }> } =
          await response.json();

        if (!cancelled) {
          setFiles(
            json.files.map((file) => ({
              ...file,
              lines: file.content.split("\n"),
            })),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch review files",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchFiles();

    return () => {
      cancelled = true;
    };
  }, []);

  return { files, loading, error };
}
