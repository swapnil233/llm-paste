# File Combiner Desktop App

A desktop application built with Electron + TypeScript + Tailwind CSS that combines multiple code files into a single text file for easy copying to LLMs.

## Features

- **File Selection**: Easy file picker with multi-selection support
- **Duplicate Removal**: Automatically removes duplicate files from selection
- **Smart Formatting**: Formats each file with proper markdown code blocks and file extensions
- **Auto Copy**: Automatically copies the combined content to clipboard
- **Desktop Save**: Saves the combined file to your desktop

## How to Use

### Multi-Step File Selection Workflow

1. **Add Individual Files**: Click "Add File" to select files one by one from different folders
2. **Bulk Selection**: Use "Select Multiple" to add several files from the same folder at once
3. **Review Selection**: See all selected files listed with file paths and count
4. **Remove Files**: Click "Remove" next to any file to remove it from the selection
5. **Clear All**: Use "Clear All" to start over with an empty selection
6. **Combine**: Click "Combine" to process all selected files

### Key Benefits

- **Cross-Folder Selection**: Navigate to different directories and build up your file collection
- **Duplicate Prevention**: Files are automatically deduplicated if you try to add the same file twice
- **Visual Management**: See exactly which files you've selected and easily remove any you don't want
- **Flexible Workflow**: Mix individual file selection with bulk selection as needed

The combined content is automatically:

- Saved to `combined_output.txt` on your desktop
- Copied to your clipboard (ready to paste into LLMs)

## Output Format

The combined file follows this format:

````
Files combined:
- /path/to/file1.js
- /path/to/file2.ts

/path/to/file1.js
```javascript
// file content here
````

/path/to/file2.ts

```typescript
// file content here
```

````

## Development

```bash
# Start development server
npm run start

# Build for production
npm run package

# Create distributable
npm run make
````

## Original CLI Script

This desktop app is based on a Node.js CLI script that combined files for LLM input. The desktop version provides the same functionality with a user-friendly GUI.
