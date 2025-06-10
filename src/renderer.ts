import './index.css';

// TypeScript interfaces for better type safety
interface FilePreviewResult {
    content: string;
    tokenCount: number;
    fileCount: number;
}

interface CombineResult {
    dest: string;
}

declare global {
    interface Window {
        api: {
            selectFiles: () => Promise<string[]>;
            generatePreview: (files: string[]) => Promise<FilePreviewResult>;
            combineFiles: (content: string) => Promise<CombineResult>;
            copyToClipboard: (text: string) => Promise<boolean>;
        };
    }
}

// File Manager Module - handles file operations and state
class FileManager {
    private files: string[] = [];
    private currentContent = '';

    getFiles(): string[] {
        return [...this.files];
    }

    addFiles(newFiles: string[]): number {
        let addedCount = 0;
        newFiles.forEach(filePath => {
            if (!this.files.includes(filePath)) {
                this.files.push(filePath);
                addedCount++;
            }
        });
        return addedCount;
    }

    removeFile(index: number): void {
        if (index >= 0 && index < this.files.length) {
            this.files.splice(index, 1);
        }
    }

    clearFiles(): void {
        this.files = [];
        this.currentContent = '';
    }

    getCurrentContent(): string {
        return this.currentContent;
    }

    setCurrentContent(content: string): void {
        this.currentContent = content;
    }

    getFileCount(): number {
        return this.files.length;
    }
}

// UI Manager Module - handles DOM updates and user interactions
class UIManager {
    private elements: {
        selectBtn: HTMLButtonElement;
        clearBtn: HTMLButtonElement;
        copyBtn: HTMLButtonElement;
        saveBtn: HTMLButtonElement;
        fileList: HTMLElement;
        fileCount: HTMLElement;
        tokenCount: HTMLElement;
        emptyState: HTMLElement;
        previewContent: HTMLElement;
        previewEmpty: HTMLElement;
        resultP: HTMLElement;
    };

    constructor() {
        this.elements = {
            selectBtn: document.getElementById('selectBtn')! as HTMLButtonElement,
            clearBtn: document.getElementById('clearBtn')! as HTMLButtonElement,
            copyBtn: document.getElementById('copyBtn')! as HTMLButtonElement,
            saveBtn: document.getElementById('saveBtn')! as HTMLButtonElement,
            fileList: document.getElementById('fileList')!,
            fileCount: document.getElementById('fileCount')!,
            tokenCount: document.getElementById('tokenCount')!,
            emptyState: document.getElementById('emptyState')!,
            previewContent: document.getElementById('previewContent')!,
            previewEmpty: document.getElementById('previewEmpty')!,
            resultP: document.getElementById('result')!,
        };

        this.setupEventDelegation();
    }

    private setupEventDelegation(): void {
        // Use event delegation for file removal buttons
        this.elements.fileList.addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('button[data-index]') as HTMLButtonElement;
            if (btn && btn.dataset) {
                const index = parseInt(btn.dataset.index!, 10);
                app.handleRemoveFile(index);
            }
        });
    }

    updateFileList(files: string[]): void {
        this.elements.fileCount.textContent = files.length.toString();

        if (files.length === 0) {
            this.elements.fileList.style.display = 'none';
            this.elements.emptyState.style.display = 'block';
            this.elements.clearBtn.disabled = true;
        } else {
            this.elements.fileList.style.display = 'block';
            this.elements.emptyState.style.display = 'none';
            this.elements.clearBtn.disabled = false;

            this.elements.fileList.innerHTML = files.map((filePath, index) => `
                <li class="flex justify-between items-center p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors">
                    <span class="text-sm text-gray-700 truncate flex-1 font-mono line-clamp-1" title="${filePath}" aria-label="File path: ${filePath}">
                        ${filePath}
                    </span>
                    <button data-index="${index}" class="ml-3 text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors" aria-label="Remove file">
                        ✕
                    </button>
                </li>
            `).join('');
        }
    }

    async updatePreview(files: string[]): Promise<void> {
        if (files.length === 0) {
            this.elements.previewContent.style.display = 'none';
            this.elements.previewEmpty.style.display = 'block';
            this.elements.tokenCount.textContent = '0 tokens';
            this.elements.copyBtn.disabled = true;
            this.elements.saveBtn.disabled = true;
            return;
        }

        try {
            // Show loading state
            this.elements.tokenCount.textContent = 'Calculating...';

            const preview = await window.api.generatePreview(files);
            app.fileManager.setCurrentContent(preview.content);

            this.elements.previewContent.style.display = 'block';
            this.elements.previewEmpty.style.display = 'none';
            this.elements.previewContent.textContent = preview.content;
            this.elements.tokenCount.textContent = `${preview.tokenCount.toLocaleString()} tokens`;

            this.elements.copyBtn.disabled = false;
            this.elements.saveBtn.disabled = false;
        } catch (error) {
            this.showMessage(`❌ Error generating preview: ${error}`, 'error');
            console.error('Preview error:', error);
        }
    }

    showMessage(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000): void {
        this.elements.resultP.textContent = message;
        this.elements.resultP.className = `text-sm ${type === 'error' ? 'text-red-600' : type === 'success' ? 'text-green-600' : 'text-blue-600'}`;

        if (duration > 0) {
            setTimeout(() => {
                this.elements.resultP.textContent = '';
                this.elements.resultP.className = 'text-sm text-gray-600';
            }, duration);
        }
    }

    setButtonState(button: HTMLButtonElement, disabled: boolean, text?: string): void {
        button.disabled = disabled;
        if (text) {
            button.textContent = text;
        }
    }

    getElements() {
        return this.elements;
    }
}

// Main Application Class - coordinates between FileManager and UIManager
class App {
    public fileManager: FileManager;
    private uiManager: UIManager;

    constructor() {
        this.fileManager = new FileManager();
        this.uiManager = new UIManager();
        this.setupEventListeners();
        this.updateUI();
    }

    private setupEventListeners(): void {
        const elements = this.uiManager.getElements();

        elements.selectBtn.addEventListener('click', () => this.handleSelectFiles());
        elements.clearBtn.addEventListener('click', () => this.handleClearFiles());
        elements.copyBtn.addEventListener('click', () => this.handleCopyToClipboard());
        elements.saveBtn.addEventListener('click', () => this.handleSaveToDesktop());
    }

    private async handleSelectFiles(): Promise<void> {
        try {
            const files = await window.api.selectFiles();
            const addedCount = this.fileManager.addFiles(files);
            await this.updateUI();

            if (addedCount > 0) {
                this.uiManager.showMessage(`✅ Added ${addedCount} file(s)`, 'success');
            }
        } catch (error) {
            this.uiManager.showMessage(`❌ Error selecting files: ${error}`, 'error');
        }
    }

    private async handleClearFiles(): Promise<void> {
        this.fileManager.clearFiles();
        await this.updateUI();
        this.uiManager.showMessage('🗑️ Cleared all files', 'info');
    }

    public async handleRemoveFile(index: number): Promise<void> {
        this.fileManager.removeFile(index);
        await this.updateUI();
    }

    private async handleCopyToClipboard(): Promise<void> {
        const content = this.fileManager.getCurrentContent();
        if (!content) return;

        const elements = this.uiManager.getElements();

        try {
            this.uiManager.setButtonState(elements.copyBtn, true, 'Copying...');

            await window.api.copyToClipboard(content);
            this.uiManager.showMessage('📋 Content copied to clipboard!', 'success');
        } catch (error) {
            this.uiManager.showMessage(`❌ Error copying to clipboard: ${error}`, 'error');
        } finally {
            this.uiManager.setButtonState(elements.copyBtn, false, 'Copy to Clipboard');
        }
    }

    private async handleSaveToDesktop(): Promise<void> {
        const content = this.fileManager.getCurrentContent();
        if (!content) return;

        const elements = this.uiManager.getElements();

        try {
            this.uiManager.setButtonState(elements.saveBtn, true, 'Saving...');

            const { dest } = await window.api.combineFiles(content);
            this.uiManager.showMessage(`💾 Saved to ${dest}`, 'success', 5000);
        } catch (error) {
            this.uiManager.showMessage(`❌ Error saving file: ${error}`, 'error');
        } finally {
            this.uiManager.setButtonState(elements.saveBtn, false, 'Save to Desktop');
        }
    }

    private async updateUI(): Promise<void> {
        const files = this.fileManager.getFiles();
        this.uiManager.updateFileList(files);
        await this.uiManager.updatePreview(files);
    }
}

// Initialize the application
const app = new App();

// Make app available globally for event delegation
(window as any).app = app;
