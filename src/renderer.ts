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
            generatePreview: (files: string[], dragDropFiles: Array<{ name: string, content: string }>) => Promise<FilePreviewResult>;
            combineFiles: (content: string) => Promise<CombineResult>;
            copyToClipboard: (text: string) => Promise<boolean>;
        };
    }
}

// File Manager Module - handles file operations and state
class FileManager {
    private files: string[] = [];
    private dragDropFiles: Array<{ name: string, content: string }> = [];
    private currentContent = '';

    getFiles(): string[] {
        return [...this.files];
    }

    getDragDropFiles(): Array<{ name: string, content: string }> {
        return [...this.dragDropFiles];
    }

    getAllFileNames(): string[] {
        return [...this.files, ...this.dragDropFiles.map(f => f.name)];
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

    addDragDropFiles(newFiles: Array<{ name: string, content: string }>): number {
        let addedCount = 0;
        newFiles.forEach(fileData => {
            if (!this.dragDropFiles.some(f => f.name === fileData.name)) {
                this.dragDropFiles.push(fileData);
                addedCount++;
            }
        });
        return addedCount;
    }

    removeFile(index: number): void {
        const totalFiles = this.getAllFileNames();
        if (index >= 0 && index < totalFiles.length) {
            if (index < this.files.length) {
                // Removing a regular file
                this.files.splice(index, 1);
            } else {
                // Removing a drag-and-drop file
                const dragIndex = index - this.files.length;
                this.dragDropFiles.splice(dragIndex, 1);
            }
        }
    }

    clearFiles(): void {
        this.files = [];
        this.dragDropFiles = [];
        this.currentContent = '';
    }

    getCurrentContent(): string {
        return this.currentContent;
    }

    setCurrentContent(content: string): void {
        this.currentContent = content;
    }

    getFileCount(): number {
        return this.files.length + this.dragDropFiles.length;
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
        dropZone: HTMLElement;
        dragOverlay: HTMLElement;
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
            dropZone: document.getElementById('dropZone')!,
            dragOverlay: document.getElementById('dragOverlay')!,
        };

        this.setupEventDelegation();
        this.setupDragAndDrop();
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

    private setupDragAndDrop(): void {
        let dragCounter = 0;

        // Prevent default drag behaviors on the entire document
        document.addEventListener('dragenter', (e) => e.preventDefault());
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('dragleave', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());

        // Handle drag enter - show overlay
        this.elements.dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter++;
            this.elements.dragOverlay.classList.remove('hidden');
            console.log('Drag enter, counter:', dragCounter);
        });

        // Handle drag over - maintain overlay
        this.elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Ensure we show the drag overlay
            this.elements.dragOverlay.classList.remove('hidden');
        });

        // Handle drag leave - hide overlay when leaving drop zone
        this.elements.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter--;
            console.log('Drag leave, counter:', dragCounter);
            if (dragCounter <= 0) {
                dragCounter = 0;
                this.elements.dragOverlay.classList.add('hidden');
            }
        });

        // Handle drop - process files
        this.elements.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter = 0;
            this.elements.dragOverlay.classList.add('hidden');

            console.log('Drop event triggered!', e.dataTransfer?.files);

            const files = Array.from(e.dataTransfer?.files || []);
            if (files.length > 0) {
                console.log('Processing', files.length, 'files');
                this.handleDroppedFiles(files);
            } else {
                console.log('No files found in drop event');
            }
        });
    }

    private async handleDroppedFiles(files: File[]): Promise<void> {
        try {
            console.log('handleDroppedFiles called with', files.length, 'files');

            // Filter for code files and read their content
            const validFilesData: Array<{ name: string, content: string }> = [];
            // Use the same comprehensive list as the main process
            const codeExtensions = new Set([
                // Web Development
                'js', 'jsx', 'ts', 'tsx', 'html', 'htm', 'css', 'scss', 'sass', 'less',
                'vue', 'svelte', 'astro', 'json', 'xml', 'yaml', 'yml', 'toml',
                // Programming Languages
                'py', 'pyx', 'pyi', 'pyw', 'java', 'kt', 'kts', 'scala', 'groovy',
                'c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hxx', 'cs', 'vb', 'fs', 'fsx',
                'go', 'rs', 'swift', 'rb', 'php', 'pl', 'pm', 'r', 'R', 'jl',
                'dart', 'elm', 'hs', 'lhs', 'ml', 'mli', 'f', 'f90', 'f95',
                // Shell & Config
                'sh', 'bash', 'zsh', 'fish', 'bat', 'cmd', 'ps1', 'psm1',
                'dockerfile', 'makefile', 'mk', 'cmake', 'gradle', 'build',
                'env', 'ini', 'conf', 'config', 'properties', 'cfg',
                // Documentation & Markup
                'md', 'markdown', 'mdx', 'rst', 'adoc', 'asciidoc', 'tex', 'txt',
                // Database & Query
                'sql', 'nosql', 'cypher', 'sparql', 'graphql', 'gql',
                // Other
                'lock', 'gitignore', 'gitattributes', 'editorconfig', 'eslintrc',
                'prettierrc', 'babelrc', 'tsconfig', 'jsconfig', 'webpack'
            ]);

            const rejectedFiles: string[] = [];

            for (const file of files) {
                console.log('Processing file:', file.name);

                // Get file extension (handle files without extensions)
                const nameParts = file.name.split('.');
                const extension = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() || '' : '';

                console.log('File extension extracted:', extension, 'from', file.name);
                console.log('Extension in codeExtensions?', codeExtensions.has(extension));

                // Check if it's a valid code file or has no extension (like README, Dockerfile, etc.)
                const isCodeFile = codeExtensions.has(extension) ||
                    extension === '' ||
                    file.name.toLowerCase().includes('dockerfile') ||
                    file.name.toLowerCase().includes('makefile') ||
                    file.name.toLowerCase().includes('readme');

                console.log('isCodeFile result for', file.name, ':', isCodeFile);

                if (isCodeFile) {
                    try {
                        // Read the file content directly (Electron 32+ compatible)
                        const content = await file.text();
                        validFilesData.push({
                            name: file.name,
                            content: content
                        });
                        console.log('Added valid file:', file.name);
                    } catch (error) {
                        console.error('Error reading file:', file.name, error);
                        rejectedFiles.push(file.name + ' (read error)');
                    }
                } else {
                    rejectedFiles.push(file.name);
                    console.log('Rejected file:', file.name, 'Extension:', extension);
                }
            }

            console.log('Valid files data:', validFilesData.length);
            console.log('Rejected files:', rejectedFiles);

            if (validFilesData.length > 0) {
                // Add files to local file manager
                const addedCount = app.fileManager.addDragDropFiles(validFilesData);
                await app.updateUI();

                let message = `✅ Added ${addedCount} file(s) via drag & drop`;
                if (rejectedFiles.length > 0) {
                    message += `\n⚠️ Skipped ${rejectedFiles.length} non-code file(s)`;
                }
                this.showMessage(message, 'success');
            } else if (rejectedFiles.length > 0) {
                this.showMessage(`❌ Only code files are supported. Skipped ${rejectedFiles.length} file(s).`, 'error');
            } else {
                this.showMessage(`❌ No valid files found. Make sure to drag code files.`, 'error');
            }
        } catch (error) {
            this.showMessage(`❌ Error processing dropped files: ${error}`, 'error');
            console.error('Drag and drop error:', error);
        }
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

            // Get both regular files and drag-and-drop files
            const regularFiles = app.fileManager.getFiles();
            const dragDropFiles = app.fileManager.getDragDropFiles();

            const preview = await window.api.generatePreview(regularFiles, dragDropFiles);
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

    public async updateUI(): Promise<void> {
        const files = this.fileManager.getAllFileNames();
        this.uiManager.updateFileList(files);
        await this.uiManager.updatePreview(files);
    }
}

// Initialize the application
const app = new App();

// Make app available globally for event delegation
(window as any).app = app;
