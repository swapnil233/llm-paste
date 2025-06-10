export interface FilePreviewResult {
    content: string;
    tokenCount: number;
    fileCount: number;
    files: string[]; // List of actual file paths/names
}

export interface CombineResult {
    dest: string;
}

export interface DragDropFile {
    name: string;
    content: string;
}

// New unified file type for state management
export interface AppFile {
    id: string;
    path: string; // For both selected and dropped files
    content?: string; // Only for dropped files
    type: 'selected' | 'dropped';
    tokenCount?: number; // Token count for this individual file
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

export type SortOption = 'name' | 'tokenCount' | 'type' | 'size';

// Extend Window interface to include our API
declare global {
    interface Window {
        api: import('../../preload').ElectronAPI;
    }
} 