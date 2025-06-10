import './index.css';

declare global {
    interface Window {
        api: {
            selectFiles: () => Promise<string[]>;
            addFile: () => Promise<string | null>;
            combineFiles: (files: string[]) => Promise<{ dest: string; combined: string }>;
        };
    }
}

const addFileBtn = document.getElementById('addFileBtn')! as HTMLButtonElement;
const selectBtn = document.getElementById('selectBtn')! as HTMLButtonElement;
const combineBtn = document.getElementById('combineBtn')! as HTMLButtonElement;
const clearBtn = document.getElementById('clearBtn')! as HTMLButtonElement;
const fileList = document.getElementById('fileList')!;
const fileCount = document.getElementById('fileCount')!;
const emptyState = document.getElementById('emptyState')!;
const resultP = document.getElementById('result')!;

let selectedFiles: string[] = [];

function updateUI() {
    fileCount.textContent = selectedFiles.length.toString();

    if (selectedFiles.length === 0) {
        fileList.style.display = 'none';
        emptyState.style.display = 'block';
        combineBtn.disabled = true;
        clearBtn.disabled = true;
    } else {
        fileList.style.display = 'block';
        emptyState.style.display = 'none';
        combineBtn.disabled = false;
        clearBtn.disabled = false;

        fileList.innerHTML = selectedFiles.map((filePath, index) => `
            <li class="flex justify-between items-center p-2 bg-white rounded border hover:bg-gray-50">
                <span class="text-xs text-gray-700 truncate flex-1" title="${filePath}">${filePath}</span>
                <button onclick="removeFile(${index})" class="ml-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50">
                    Remove
                </button>
            </li>
        `).join('');
    }

    resultP.textContent = '';
}

// Make removeFile available globally for the onclick handlers
(window as any).removeFile = (index: number) => {
    selectedFiles.splice(index, 1);
    updateUI();
};

addFileBtn.addEventListener('click', async () => {
    const filePath = await window.api.addFile();
    if (filePath && !selectedFiles.includes(filePath)) {
        selectedFiles.push(filePath);
        updateUI();
    } else if (filePath && selectedFiles.includes(filePath)) {
        resultP.textContent = '⚠️ File already in the list';
        setTimeout(() => resultP.textContent = '', 3000);
    }
});

selectBtn.addEventListener('click', async () => {
    const files = await window.api.selectFiles();
    files.forEach(filePath => {
        if (!selectedFiles.includes(filePath)) {
            selectedFiles.push(filePath);
        }
    });
    updateUI();
});

clearBtn.addEventListener('click', () => {
    selectedFiles = [];
    updateUI();
});

combineBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    try {
        combineBtn.disabled = true;
        combineBtn.textContent = 'Combining...';

        const { dest } = await window.api.combineFiles(selectedFiles);
        resultP.textContent = `✅ Combined ${selectedFiles.length} files! Saved to ${dest} and copied to clipboard`;

        // Reset after successful combine
        selectedFiles = [];
        updateUI();
    } catch (error) {
        resultP.textContent = `❌ Error combining files: ${error}`;
    } finally {
        combineBtn.disabled = false;
        combineBtn.textContent = 'Combine';
    }
});

// Initialize UI
updateUI();
