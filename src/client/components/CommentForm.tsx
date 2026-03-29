import { useState, useRef, useEffect, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";

interface CommentFormProps {
  startLine: number;
  endLine: number;
  blockType: string;
  onSubmit: (text: string, screenshots: File[]) => void;
  onCancel: () => void;
  initialText?: string;
}

interface ScreenshotPreview {
  file: File;
  url: string;
}

export function CommentForm({
  startLine,
  endLine,
  onSubmit,
  onCancel,
  initialText = "",
}: CommentFormProps) {
  const [text, setText] = useState(initialText);
  const [screenshots, setScreenshots] = useState<ScreenshotPreview[]>([]);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const lineLabel =
    startLine === endLine
      ? `Line ${startLine}`
      : `Lines ${startLine}-${endLine}`;

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (text.trim()) {
        onSubmit(
          text,
          screenshots.map((s) => s.file),
        );
      }
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          addScreenshot(file);
        }
      }
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);

    const files = e.dataTransfer?.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        addScreenshot(file);
      }
    }
  }

  function addScreenshot(file: File) {
    const url = URL.createObjectURL(file);
    setScreenshots((prev) => [...prev, { file, url }]);
  }

  function removeScreenshot(index: number) {
    setScreenshots((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleSubmit() {
    onSubmit(
      text,
      screenshots.map((s) => s.file),
    );
  }

  return (
    <div
      className={`comment-form${dragging ? " dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="comment-form__header">{lineLabel}</div>
      <textarea
        ref={textareaRef}
        className="comment-form__textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
      {screenshots.length > 0 && (
        <div className="comment-form__thumbnails">
          {screenshots.map((screenshot, index) => (
            <div key={screenshot.url} className="comment-form__thumbnail">
              <img src={screenshot.url} alt={`Screenshot ${index + 1}`} />
              <button onClick={() => removeScreenshot(index)}>&times;</button>
            </div>
          ))}
        </div>
      )}
      <div className="comment-form__actions">
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
        >
          Add comment
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
