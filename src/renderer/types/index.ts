export interface FilePreviewResult {
    content: string;
    tokenCount: number;
    fileCount: number;
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
        api: import('../../preload').ElectronAPI;
    }
} 