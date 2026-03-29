export interface ReviewFile {
  path: string;
  relativePath: string;
  content: string;
  lines: string[];
}

export interface BlockSelection {
  startLine: number;
  endLine: number;
  blockType: string;
}

export interface Comment {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  blockType: string;
  selectedText: string;
  comment: string;
  screenshots: File[];
}

export interface ActiveCommentForm {
  filePath: string;
  startLine: number;
  endLine: number;
  blockType: string;
  selectedText: string;
  editingId?: string;
}

export interface ReviewSubmission {
  reviewedFiles: string[];
  submittedAt: string;
  comments: Array<{
    file: string;
    startLine: number;
    endLine: number;
    blockType: string;
    selectedText: string;
    comment: string;
    screenshots: string[];
  }>;
}
