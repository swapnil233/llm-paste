import React, { useState, useCallback, useRef, useMemo } from "react";
import { useElectron } from "../hooks/useElectron";
import { useToast } from "../contexts/ToastContext";
import type { DragDropFile, AppFile, SortOption } from "../types";

interface FileListProps {
  files: AppFile[];
  onFilesSelected: (files: string[]) => void;
  onDragDropFilesAdded: (files: DragDropFile[]) => void;
  onRemoveFile: (fileId: string) => void;
  onClearAll: () => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  onFilesSelected,
  onDragDropFilesAdded,
  onRemoveFile,
  onClearAll,
}) => {
  const api = useElectron();
  const { showToast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const dragCounterRef = useRef(0);

  const hasFiles = files.length > 0;

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = files.filter((file) =>
        file.path.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.path.localeCompare(b.path);
        case "tokenCount":
          return (b.tokenCount || 0) - (a.tokenCount || 0); // Descending
        case "type":
          if (a.type === b.type) return a.path.localeCompare(b.path);
          return a.type === "selected" ? -1 : 1; // Selected files first
        case "size": {
          // For drag-drop files, use content length; for selected files, approximate
          const sizeA = a.content?.length || a.path.length;
          const sizeB = b.content?.length || b.path.length;
          return sizeB - sizeA; // Descending
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [files, searchQuery, sortBy]);

  const handleSelectFiles = useCallback(async () => {
    try {
      const files = await api.selectFiles();
      if (files.length > 0) {
        onFilesSelected(files);
        showToast(`Added ${files.length} file(s)`, "success");
      }
    } catch (error) {
      showToast(`Error selecting files: ${error}`, "error");
    }
  }, [api, onFilesSelected, showToast]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only show overlay if dragging files
    if (e.dataTransfer.types.includes("Files")) {
      dragCounterRef.current++;
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Ensure we maintain the drag state
    if (e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      try {
        const validFilesData: DragDropFile[] = [];
        const rejectedFiles: string[] = [];

        // Define supported extensions
        const codeExtensions = new Set([
          "js",
          "jsx",
          "ts",
          "tsx",
          "html",
          "htm",
          "css",
          "scss",
          "sass",
          "less",
          "vue",
          "svelte",
          "astro",
          "json",
          "xml",
          "yaml",
          "yml",
          "toml",
          "py",
          "pyx",
          "pyi",
          "pyw",
          "java",
          "kt",
          "kts",
          "scala",
          "groovy",
          "c",
          "cpp",
          "cc",
          "cxx",
          "h",
          "hpp",
          "hxx",
          "cs",
          "vb",
          "fs",
          "fsx",
          "go",
          "rs",
          "swift",
          "rb",
          "php",
          "pl",
          "pm",
          "r",
          "jl",
          "dart",
          "elm",
          "hs",
          "lhs",
          "ml",
          "mli",
          "f",
          "f90",
          "f95",
          "sh",
          "bash",
          "zsh",
          "fish",
          "bat",
          "cmd",
          "ps1",
          "psm1",
          "dockerfile",
          "makefile",
          "mk",
          "cmake",
          "gradle",
          "build",
          "env",
          "ini",
          "conf",
          "config",
          "properties",
          "cfg",
          "md",
          "markdown",
          "mdx",
          "rst",
          "adoc",
          "asciidoc",
          "tex",
          "txt",
          "sql",
          "nosql",
          "cypher",
          "sparql",
          "graphql",
          "gql",
          "lock",
          "gitignore",
          "gitattributes",
          "editorconfig",
          "eslintrc",
          "prettierrc",
          "babelrc",
          "tsconfig",
          "jsconfig",
          "webpack",
        ]);

        for (const file of files) {
          const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
          const isCodeFile =
            codeExtensions.has(fileExt) ||
            fileExt === "" ||
            file.name.toLowerCase().includes("dockerfile") ||
            file.name.toLowerCase().includes("makefile") ||
            file.name.toLowerCase().includes("readme");

          if (isCodeFile) {
            try {
              const content = await file.text();
              validFilesData.push({ name: file.name, content });
            } catch (error) {
              rejectedFiles.push(`${file.name} (read error)`);
            }
          } else {
            rejectedFiles.push(file.name);
          }
        }

        if (validFilesData.length > 0) {
          onDragDropFilesAdded(validFilesData);
          let message = `Added ${validFilesData.length} file(s) via drag & drop`;
          if (rejectedFiles.length > 0) {
            const displayFiles = rejectedFiles.slice(0, 2);
            const remaining = rejectedFiles.length - 2;
            let rejectedText = displayFiles.join(", ");
            if (remaining > 0) {
              rejectedText += ` ...and ${remaining} more`;
            }
            message += `<br><small>Rejected: ${rejectedText}</small>`;
          }
          showToast(message, "success");
        } else if (rejectedFiles.length > 0) {
          showToast("Only code files are supported", "error");
        }
      } catch (error) {
        showToast(`Error processing dropped files: ${error}`, "error");
      }
    },
    [onDragDropFilesAdded, showToast]
  );

  return (
    <div className="resize-x overflow-auto bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <div className="flex justify-between items-center mb-3">
          <span className="text-base font-medium text-gray-700 dark:text-gray-300">
            Selected Files ({filteredAndSortedFiles.length}
            {filteredAndSortedFiles.length !== files.length
              ? ` of ${files.length}`
              : ""}
            )
          </span>
          <button
            onClick={onClearAll}
            disabled={!hasFiles}
            className="text-sm btn-danger flex items-center gap-1 disabled:opacity-50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ></path>
            </svg>
            Reset
          </button>
        </div>
        <button onClick={handleSelectFiles} className="w-full btn-primary">
          Select Files
        </button>

        {/* Filters Row */}
        {hasFiles && (
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="tokenCount">Sort by Tokens</option>
              <option value="type">Sort by Type</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>
        )}
      </div>

      {/* File List / Drop Zone */}
      <div
        className="flex-1 overflow-hidden relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {hasFiles ? (
          <ul className="text-base space-y-1 p-4 h-full overflow-y-auto">
            {filteredAndSortedFiles.map((file) => (
              <li
                key={file.id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="text-sm text-gray-700 dark:text-gray-300 truncate font-mono"
                    title={file.path}
                  >
                    {file.path}
                  </span>
                  {file.tokenCount !== undefined && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 shrink-0">
                      {file.tokenCount.toLocaleString()} tokens
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shrink-0">
                    {file.type}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveFile(file.id)}
                  className="ml-3 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-base text-gray-500 dark:text-gray-400 text-center py-8">
            Drag files here or click "Select Files"
          </div>
        )}

        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 bg-opacity-90 border-2 border-dashed border-blue-300 dark:border-blue-600 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="text-4xl mb-2">📁</div>
              <div className="text-lg font-medium text-blue-700 dark:text-blue-300">
                Drop files here
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Release to add files to your selection
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;
