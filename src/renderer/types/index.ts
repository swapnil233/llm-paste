export interface TreeNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: TreeNode[];
    filePaths?: string[]; // Precomputed descendant file paths for directories
}

export interface FilePreviewResult {
    content: string;
    tokenCount: number;
    fileCount: number;
    files: string[];
    fileTokenCounts: Record<string, number>;
}

export interface CombineResult {
    dest: string;
}

export interface DragDropFile {
    name: string;
    content: string;
}

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
}

export interface TokenLimit {
    value: number;
    label: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';

// Extend Window interface to include our API
declare global {
    interface Window {
        api: import('../../shared/ipc').ElectronAPI;
    }
}
