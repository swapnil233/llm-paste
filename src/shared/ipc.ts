import type { TreeNode, FilePreviewResult, CombineResult, ThemeMode } from "../renderer/types";

export interface ElectronAPI {
  openProject: () => Promise<TreeNode | null>;
  selectFiles: () => Promise<string[]>;
  selectFolders: () => Promise<string[]>;
  generatePreview: (
    files: string[],
    dragDropFiles: Array<{ name: string; content: string }>
  ) => Promise<FilePreviewResult>;
  combineFiles: (content: string) => Promise<CombineResult>;
  copyToClipboard: (text: string) => Promise<boolean>;
  shouldUseDarkColors: () => Promise<boolean>;
  setTheme: (theme: ThemeMode) => Promise<boolean>;
}
