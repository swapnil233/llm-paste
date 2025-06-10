# File Combiner Desktop App

A desktop application built with Electron + TypeScript + Tailwind CSS that combines multiple code files into a single text file for easy copying to LLMs.

## Features

- **Two-Panel Interface**: Left panel for file management, right panel for real-time preview
- **File Selection**: Easy file picker with multi-selection support
- **Duplicate Removal**: Automatically removes duplicate files from selection
- **Real-Time Preview**: See the combined content update instantly as you add/remove files
- **Token Counting**: Uses tiktoken to show GPT-4 token count for the combined content
- **Smart Formatting**: Formats each file with proper markdown code blocks and file extensions
- **Instant Copy**: Copy the combined content to clipboard with one click
- **Desktop Save**: Save the combined file to your desktop
- **Visual File Management**: Easy-to-use interface for adding and removing files

## How to Use

### Two-Panel Workflow

**Left Panel - File Management:**

1. **Select Files**: Click "Select Files" to choose one or multiple files from any folder
2. **Review Selection**: See all selected files listed with full file paths and count
3. **Remove Files**: Click "✕" next to any file to remove it from the selection
4. **Clear All**: Use "Clear All" to start over with an empty selection

**Right Panel - Real-Time Preview:**

1. **Live Preview**: See the combined content update instantly as you add/remove files
2. **Token Count**: Monitor the GPT-4 token count to stay within LLM limits
3. **Copy to Clipboard**: One-click copy of the entire combined content
4. **Save to Desktop**: Save the combined content as `combined_output.txt`

### Key Benefits

- **Real-Time Feedback**: See exactly what your combined output will look like before saving
- **Token Awareness**: Know the token count to optimize for LLM context limits
- **Cross-Folder Selection**: Navigate to different directories and build up your file collection
- **Duplicate Prevention**: Files are automatically deduplicated if you try to add the same file twice
- **Instant Actions**: Copy or save the content with immediate feedback
- **Visual Management**: Clean, intuitive interface for managing your file selection

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
