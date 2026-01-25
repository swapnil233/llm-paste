# CLAUDE.md - LLM Paste Codebase Guide

## Project Overview

**LLM Paste** is a cross-platform Electron desktop application that combines multiple code files into a single formatted text file optimized for Large Language Model input. It provides a two-panel interface for file selection and real-time preview with token counting.

**Core Features:**
- Two-panel interface (file management + live preview)
- Multi-file/folder selection with automatic deduplication
- Real-time token counting (GPT-4, Claude, Gemini models)
- Drag-and-drop file support
- Syntax highlighting with markdown code blocks
- Dark/light theme support
- Copy to clipboard and save to desktop

## Technology Stack

| Category | Technologies |
|----------|--------------|
| **Framework** | Electron 36.4.0 |
| **Build Tool** | Electron Forge 7.8.1 with Webpack |
| **UI** | React 19.1.0, TypeScript ~4.5.4 |
| **Styling** | Tailwind CSS 3.4.17, PostCSS |
| **Rendering** | react-markdown, rehype-highlight, highlight.js |
| **Token Counting** | tiktoken 1.0.21 |
| **Icons** | @tabler/icons-react |

## Directory Structure

```
llm-paste/
├── src/
│   ├── index.ts              # Main process - IPC handlers, file operations, window management
│   ├── preload.ts            # Preload script - secure API bridge to renderer
│   ├── index.html            # HTML entry point
│   ├── index.css             # Global styles (Tailwind)
│   ├── constants/
│   │   ├── codeExtensions.ts # Supported file extensions & ignored directories
│   │   └── ignored.ts        # Files to ignore (package-lock.json, .DS_Store)
│   ├── renderer/
│   │   ├── index.tsx         # React entry point
│   │   ├── components/
│   │   │   ├── App.tsx       # Main app - state management, layout
│   │   │   ├── FileList.tsx  # Left panel - file selection & management
│   │   │   ├── PreviewPane.tsx # Right panel - preview & token display
│   │   │   ├── Button.tsx    # Reusable button component
│   │   │   ├── ResizeHandle.tsx # Panel resize handle
│   │   │   └── Toast.tsx     # Toast notifications
│   │   ├── contexts/
│   │   │   └── ToastContext.tsx # Toast notification context
│   │   ├── hooks/
│   │   │   ├── useElectron.ts # Hook for Electron API access
│   │   │   └── useTheme.ts   # Theme management hook
│   │   └── types/
│   │       └── index.ts      # TypeScript type definitions
│   └── utils/
│       └── getFileIcon.tsx   # File icon rendering utility
├── forge.config.ts           # Electron Forge configuration
├── webpack.*.ts              # Webpack configuration files
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── .eslintrc.json            # ESLint configuration
└── package.json              # Dependencies and scripts
```

## Architecture

### Process Separation (Electron Pattern)

1. **Main Process** (`src/index.ts`)
   - Creates and manages the BrowserWindow
   - Handles all file system operations
   - Manages IPC communication
   - Performs token counting with tiktoken
   - Controls native dialogs and clipboard

2. **Preload Script** (`src/preload.ts`)
   - Bridges main and renderer processes securely
   - Exposes controlled API via `contextBridge`
   - Ensures context isolation (nodeIntegration disabled)

3. **Renderer Process** (`src/renderer/`)
   - React application with component-based architecture
   - Accesses Electron APIs only through `window.api`
   - Uses hooks pattern for state and effects

### IPC Communication Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `dialog:openFiles` | Renderer → Main | Open file picker dialog |
| `dialog:openFolders` | Renderer → Main | Open folder picker dialog |
| `files:generatePreview` | Renderer → Main | Generate combined content + token count |
| `files:getTokenCounts` | Renderer → Main | Get per-file token counts |
| `files:combine` | Renderer → Main | Save to desktop + copy to clipboard |
| `clipboard:writeText` | Renderer → Main | Copy text to clipboard |
| `theme:shouldUseDarkColors` | Renderer → Main | Get system dark mode preference |
| `theme:setTheme` | Renderer → Main | Set app theme |

### Data Flow

```
User Action → FileList Component → App State (files[])
                                        ↓
                              useEffect triggers
                                        ↓
                              api.generatePreview() IPC call
                                        ↓
                              Main Process generates content
                                        ↓
                              Returns { content, tokenCount, fileCount, files }
                                        ↓
                              PreviewPane displays result
```

## Development Commands

```bash
# Start development server with hot reload
npm run start

# Build for production (unpacked)
npm run package

# Create distributable installers
npm run make

# Run ESLint
npm run lint
```

## Code Conventions

### TypeScript

- **Strict typing**: `noImplicitAny: true` enforced
- **Interface-first**: Define interfaces for all data structures
- **Type exports**: Export types from centralized locations (`src/renderer/types/index.ts`)
- **React FC typing**: Use `React.FC` for functional components

```typescript
// Good: Interface-defined props
interface ButtonProps {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost' | 'link';
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', onClick }) => { ... }
```

### React Patterns

- **Functional components only**: No class components
- **Hooks for state**: `useState`, `useEffect`, `useCallback`, `useMemo`
- **Custom hooks**: Extract reusable logic (`useElectron`, `useTheme`)
- **Context for cross-cutting concerns**: `ToastContext` for notifications
- **Memoization**: Use `useCallback` for event handlers passed to children

```typescript
// Pattern: useCallback for stable references
const handleRemoveFile = useCallback((fileId: string) => {
  setFiles((prev) => prev.filter((f) => f.id !== fileId));
}, []);
```

### File Organization

- Components in `src/renderer/components/`
- Hooks in `src/renderer/hooks/`
- Contexts in `src/renderer/contexts/`
- Types in `src/renderer/types/`
- Constants in `src/constants/`

### Styling

- **Tailwind CSS**: Utility-first classes
- **Dark mode**: Use `dark:` prefix for dark theme variants
- **Class-based dark mode**: Configured in `tailwind.config.js`
- **Responsive**: Use Tailwind responsive prefixes as needed

```tsx
// Example: Dark mode support
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

### Security

- **Context isolation**: Always enabled
- **Node integration**: Disabled in renderer
- **Preload bridge**: All Electron APIs exposed through controlled interface
- **API freezing**: `Object.freeze(api)` prevents modification

## Key Types

```typescript
// Unified file representation
interface AppFile {
  id: string;
  path: string;
  content?: string;        // Only for dropped files
  type: 'selected' | 'dropped';
  tokenCount?: number;
}

// Preview generation result
interface FilePreviewResult {
  content: string;
  tokenCount: number;
  fileCount: number;
  files: string[];
}

// Toast notifications
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}
```

## File Type Support

### Supported Extensions (90+)

Defined in `src/constants/codeExtensions.ts`:

- **Web**: js, jsx, ts, tsx, html, css, scss, vue, svelte, astro, json, yaml
- **Programming**: py, java, kt, go, rs, swift, rb, php, c, cpp, cs
- **Shell/Config**: sh, bash, dockerfile, makefile, env, ini
- **Database**: sql, graphql, prisma
- **Documentation**: md, markdown, mdx, rst, txt

### Ignored Patterns

**Directories** (`IGNORED_DIRS`):
- node_modules, .git, .next, dist, build, out, .cache, coverage

**Files** (`IGNORED_FILES`):
- package-lock.json, .DS_Store

## Common Tasks for AI Assistants

### Adding a New IPC Handler

1. Add handler in `src/index.ts`:
```typescript
ipcMain.handle('channel:name', async (_e, arg: ArgType): Promise<ReturnType> => {
  // Implementation
  return result;
});
```

2. Add to preload API in `src/preload.ts`:
```typescript
interface ElectronAPI {
  newMethod: (arg: ArgType) => Promise<ReturnType>;
}

const api: ElectronAPI = {
  newMethod: (arg) => ipcRenderer.invoke('channel:name', arg),
};
```

3. Use in React via `useElectron()` hook

### Adding a New Component

1. Create in `src/renderer/components/NewComponent.tsx`
2. Use `React.FC` with typed props interface
3. Import and use in parent component
4. Follow Tailwind styling conventions with dark mode support

### Adding a New File Extension

Edit `src/constants/codeExtensions.ts`:
```typescript
export const CODE_EXTENSIONS = new Set<string>([
  // ... existing extensions
  'newext',
]);
```

### Modifying Token Counting

Token counting uses `tiktoken` in the main process (`src/index.ts`):
```typescript
const encoding = encoding_for_model('gpt-4');
tokenCount = encoding.encode(output.trim()).length;
encoding.free(); // Important: Free the encoding to prevent memory leaks
```

## Performance Considerations

- **Syntax highlighting disabled** for content > 8000 lines
- **Pending request deduplication**: Only latest preview request updates state
- **Memoized sorting/filtering**: Use `useMemo` for expensive computations
- **Tiktoken encoding freed**: Always call `encoding.free()` after use

## Testing

No test suite is currently configured. When adding tests:
- Recommend Jest for unit tests
- Recommend Playwright or Spectron for E2E tests
- Main process logic is most testable in isolation

## Build & Distribution

Electron Forge handles packaging:

```bash
# Development build
npm run package

# Create distributable (platform-specific)
npm run make
```

Output goes to `out/` directory. Supports:
- Windows: Squirrel installer
- macOS: ZIP archive
- Linux: DEB, RPM packages
