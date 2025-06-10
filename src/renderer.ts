import './index.css';

declare global {
    interface Window {
        api: {
            selectFiles: () => Promise<string[]>;
            generatePreview: (files: string[]) => Promise<{ content: string; tokenCount: number; fileCount: number }>;
            combineFiles: (content: string) => Promise<{ dest: string }>;
            copyToClipboard: (text: string) => Promise<boolean>;
        };
    }
}

const selectBtn = document.getElementById('selectBtn')! as HTMLButtonElement;
const clearBtn = document.getElementById('clearBtn')! as HTMLButtonElement;
const copyBtn = document.getElementById('copyBtn')! as HTMLButtonElement;
const saveBtn = document.getElementById('saveBtn')! as HTMLButtonElement;
const fileList = document.getElementById('fileList')!;
const fileCount = document.getElementById('fileCount')!;
const tokenCount = document.getElementById('tokenCount')!;
const emptyState = document.getElementById('emptyState')!;
const previewContent = document.getElementById('previewContent')!;
const previewEmpty = document.getElementById('previewEmpty')!;
const resultP = document.getElementById('result')!;

let selectedFiles: string[] = [];
let currentContent = '';

async function updatePreview() {
    if (selectedFiles.length === 0) {
        previewContent.style.display = 'none';
        previewEmpty.style.display = 'block';
        tokenCount.textContent = '0 tokens';
        currentContent = '';
        copyBtn.disabled = true;
        saveBtn.disabled = true;
        return;
    }

    try {
        const preview = await window.api.generatePreview(selectedFiles);
        currentContent = preview.content;

        previewContent.style.display = 'block';
        previewEmpty.style.display = 'none';
        previewContent.textContent = preview.content;
        tokenCount.textContent = `${preview.tokenCount.toLocaleString()} tokens`;

        copyBtn.disabled = false;
        saveBtn.disabled = false;
    } catch (error) {
        resultP.textContent = `❌ Error generating preview: ${error}`;
        console.error('Preview error:', error);
    }
}

function updateFileList() {
    fileCount.textContent = selectedFiles.length.toString();

    if (selectedFiles.length === 0) {
        fileList.style.display = 'none';
        emptyState.style.display = 'block';
        clearBtn.disabled = true;
    } else {
        fileList.style.display = 'block';
        emptyState.style.display = 'none';
        clearBtn.disabled = false;

        fileList.innerHTML = selectedFiles.map((filePath, index) => `
            <li class="flex justify-between items-center p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors">
                <span class="text-xs text-gray-700 truncate flex-1 font-mono" title="${filePath}">${filePath}</span>
                <button onclick="removeFile(${index})" class="ml-3 text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors">
                    ✕
                </button>
            </li>
        `).join('');
    }
}

async function updateUI() {
    updateFileList();
    await updatePreview();
    resultP.textContent = '';
}

// Make removeFile available globally for the onclick handlers
(window as any).removeFile = async (index: number) => {
    selectedFiles.splice(index, 1);
    await updateUI();
};

selectBtn.addEventListener('click', async () => {
    try {
        const files = await window.api.selectFiles();
        files.forEach(filePath => {
            if (!selectedFiles.includes(filePath)) {
                selectedFiles.push(filePath);
            }
        });
        await updateUI();

        if (files.length > 0) {
            resultP.textContent = `✅ Added ${files.length} file(s)`;
            setTimeout(() => resultP.textContent = '', 3000);
        }
    } catch (error) {
        resultP.textContent = `❌ Error selecting files: ${error}`;
    }
});

clearBtn.addEventListener('click', async () => {
    selectedFiles = [];
    await updateUI();
    resultP.textContent = '🗑️ Cleared all files';
    setTimeout(() => resultP.textContent = '', 3000);
});

copyBtn.addEventListener('click', async () => {
    if (!currentContent) return;

    try {
        copyBtn.disabled = true;
        copyBtn.textContent = 'Copying...';

        await window.api.copyToClipboard(currentContent);
        resultP.textContent = '📋 Content copied to clipboard!';
        setTimeout(() => resultP.textContent = '', 3000);
    } catch (error) {
        resultP.textContent = `❌ Error copying to clipboard: ${error}`;
    } finally {
        copyBtn.disabled = false;
        copyBtn.textContent = 'Copy to Clipboard';
    }
});

saveBtn.addEventListener('click', async () => {
    if (!currentContent) return;

    try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const { dest } = await window.api.combineFiles(currentContent);
        resultP.textContent = `💾 Saved to ${dest}`;
        setTimeout(() => resultP.textContent = '', 5000);
    } catch (error) {
        resultP.textContent = `❌ Error saving file: ${error}`;
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save to Desktop';
    }
});

// Initialize UI
updateUI();
