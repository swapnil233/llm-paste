# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LLM Paste** is an Electron desktop app that combines multiple code files into a single formatted text file optimized for LLM input. It features a two-panel interface (file selection + live preview) with real-time token counting using tiktoken.

## Development Commands

```bash
npm run start    # Start dev server with hot reload
npm run package  # Build for production (unpacked)
npm run make     # Create distributable installers
npm run lint     # Run ESLint
```

## Architecture

### Electron Process Model

The app follows standard Electron security patterns with three processes:

1. **Main Process** (`src/index.ts`) - Node.js environment handling file system ops, native dialogs, clipboard, and token counting with tiktoken
2. **Preload Script** (`src/preload.ts`) - Secure bridge exposing `window.api` to renderer via `contextBridge`
3. **Renderer Process** (`src/renderer/`) - React app that accesses Electron APIs only through `window.api`

### IPC Channels

| Channel | Purpose |
| ------- | ------- |
| `dialog:openFiles` | Open file picker dialog |
| `dialog:openFolders` | Open folder picker dialog |
| `files:generatePreview` | Generate combined content + token count |
| `files:getTokenCounts` | Get per-file token counts |
| `files:combine` | Save to desktop + copy to clipboard |
| `clipboard:writeText` | Copy text to clipboard |
| `theme:shouldUseDarkColors` | Get system dark mode preference |
| `theme:setTheme` | Set app theme |

### Data Flow

```text
User adds files → FileList updates App state (files[])
                           ↓
                  useEffect calls api.generatePreview()
                           ↓
                  Main process reads files, counts tokens
                           ↓
                  Returns { content, tokenCount, fileCount, files }
                           ↓
                  PreviewPane renders result
```

## Key Implementation Details

### Adding a New IPC Handler

1. Add handler in `src/index.ts`:

```typescript
ipcMain.handle('channel:name', async (_e, arg: ArgType): Promise<ReturnType> => {
  return result;
});
```

2. Expose in `src/preload.ts`:

```typescript
const api: ElectronAPI = {
  newMethod: (arg) => ipcRenderer.invoke('channel:name', arg),
};
```

3. Use in React via `useElectron()` hook

### Token Counting

Token counting uses tiktoken in the main process. Always free the encoding to prevent memory leaks:

```typescript
const encoding = encoding_for_model('gpt-4');
tokenCount = encoding.encode(output.trim()).length;
encoding.free(); // Important: prevents memory leaks
```

### File Extension Support

Supported extensions are defined in `src/constants/codeExtensions.ts`. Ignored directories (node_modules, .git, etc.) and files are in the same file under `IGNORED_DIRS`.

### Performance Notes

- Syntax highlighting is disabled for content > 8000 lines
- Only the latest preview request updates state (deduplication)
- Use `useMemo` for expensive computations in React components

## Styling

Uses Tailwind CSS with class-based dark mode. Always include `dark:` variants:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

## Build Output

Output goes to `out/` directory. Electron Forge creates platform-specific distributables (Squirrel for Windows, ZIP for macOS, DEB/RPM for Linux).
