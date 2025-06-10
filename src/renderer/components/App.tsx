import React, { useState, useEffect, useCallback, useRef } from "react";
import { useElectron } from "../hooks/useElectron";
import { useTheme } from "../hooks/useTheme";
import { ToastProvider } from "../contexts/ToastContext";
import FileList from "./FileList";
import PreviewPane from "./PreviewPane";
import ResizeHandle from "./ResizeHandle";
import Toast from "./Toast";
import type { DragDropFile, FilePreviewResult, AppFile } from "../types";

const App: React.FC = () => {
  const api = useElectron();
  const { toggleTheme } = useTheme();
  const pendingPreviewRef = useRef<Promise<FilePreviewResult> | null>(null);

  // Unified file state management
  const [files, setFiles] = useState<AppFile[]>([]);
  const [previewContent, setPreviewContent] = useState("");
  const [previewFiles, setPreviewFiles] = useState<string[]>([]);
  const [tokenCount, setTokenCount] = useState(0);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [currentTokenLimit, setCurrentTokenLimit] = useState(128000);

  // Generate preview whenever files change
  useEffect(() => {
    const generatePreview = async () => {
      if (files.length === 0) {
        setPreviewContent("");
        setPreviewFiles([]);
        setTokenCount(0);
        return;
      }

      setIsLoadingPreview(true);
      try {
        // Convert unified files back to the format expected by the API
        const selectedFiles = files
          .filter((f) => f.type === "selected")
          .map((f) => f.path);
        const dragDropFiles = files
          .filter((f) => f.type === "dropped" && f.content !== undefined)
          .map((f) => ({ name: f.path, content: f.content as string }));

        const previewPromise = api.generatePreview(
          selectedFiles,
          dragDropFiles
        );
        pendingPreviewRef.current = previewPromise;

        const result = await previewPromise;

        // Only update state if this is still the latest request
        if (pendingPreviewRef.current === previewPromise) {
          setPreviewContent(result.content);
          setPreviewFiles(result.files);
          setTokenCount(result.tokenCount);
        }
      } catch (error) {
        console.error("Error generating preview:", error);
        if (pendingPreviewRef.current) {
          setPreviewContent("");
          setPreviewFiles([]);
          setTokenCount(0);
        }
      } finally {
        setIsLoadingPreview(false);
      }
    };

    generatePreview();
  }, [files, api]);

  // Fetch individual file token counts when files change
  useEffect(() => {
    const fetchTokenCounts = async () => {
      if (files.length === 0) return;

      try {
        const selectedFiles = files
          .filter((f) => f.type === "selected")
          .map((f) => f.path);
        const dragDropFiles = files
          .filter((f) => f.type === "dropped" && f.content !== undefined)
          .map((f) => ({ name: f.path, content: f.content as string }));

        const tokenCounts = await api.getTokenCounts(
          selectedFiles,
          dragDropFiles
        );

        // Update files with token counts
        setFiles((prev) =>
          prev.map((file) => ({
            ...file,
            tokenCount: tokenCounts[file.path] || 0,
          }))
        );
      } catch (error) {
        console.error("Error fetching token counts:", error);
      }
    };

    fetchTokenCounts();
  }, [files.length, api]); // Only run when number of files changes

  // When selecting files
  const handleFilesSelected = useCallback((paths: string[]) => {
    setFiles((prev) => {
      const newFiles = paths
        .filter((path) => !prev.some((f) => f.path === path)) // Deduplicate
        .map((path) => ({
          id: `file-${Date.now()}-${Math.random()}`,
          path,
          type: "selected" as const,
        }));
      return [...prev, ...newFiles];
    });
  }, []);

  // When selecting folders (same logic as files since folders are expanded to files)
  const handleFoldersSelected = useCallback((paths: string[]) => {
    setFiles((prev) => {
      const newFiles = paths
        .filter((path) => !prev.some((f) => f.path === path)) // Deduplicate
        .map((path) => ({
          id: `folder-${Date.now()}-${Math.random()}`,
          path,
          type: "selected" as const,
        }));
      return [...prev, ...newFiles];
    });
  }, []);

  // When dropping files
  const handleDragDropFilesAdded = useCallback(
    (droppedFiles: DragDropFile[]) => {
      setFiles((prev) => {
        const newFiles = droppedFiles
          .filter((dFile) => !prev.some((f) => f.path === dFile.name)) // Deduplicate
          .map((dFile) => ({
            id: `drop-${Date.now()}-${Math.random()}`,
            path: dFile.name,
            content: dFile.content,
            type: "dropped" as const,
          }));
        return [...prev, ...newFiles];
      });
    },
    []
  );

  // Removing a file is now much simpler and more robust
  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  // Bulk remove filtered files
  const handleRemoveFiltered = useCallback((ids: string[]) => {
    setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
  }, []);

  return (
    <ToastProvider>
      <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                File Combiner
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Select files from different folders and preview the combined
                output
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div
            data-resize-panel="left"
            style={{ width: "50%", minWidth: "300px", maxWidth: "70%" }}
          >
            <FileList
              files={files}
              onFilesSelected={handleFilesSelected}
              onFoldersSelected={handleFoldersSelected}
              onDragDropFilesAdded={handleDragDropFilesAdded}
              onRemoveFile={handleRemoveFile}
              onRemoveFiltered={handleRemoveFiltered}
              onClearAll={handleClearAll}
            />
          </div>

          <ResizeHandle />

          <PreviewPane
            content={previewContent}
            files={previewFiles}
            tokenCount={tokenCount}
            isLoading={isLoadingPreview}
            currentTokenLimit={currentTokenLimit}
            onTokenLimitChange={setCurrentTokenLimit}
          />
        </div>

        <Toast />
      </div>
    </ToastProvider>
  );
};

export default App;
