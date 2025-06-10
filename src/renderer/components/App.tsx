import React, { useState, useEffect, useCallback, useRef } from "react";
import { useElectron } from "../hooks/useElectron";
import { useTheme } from "../hooks/useTheme";
import { ToastProvider } from "../contexts/ToastContext";
import FileList from "./FileList";
import PreviewPane from "./PreviewPane";
import ResizeHandle from "./ResizeHandle";
import Toast from "./Toast";
import type { DragDropFile, FilePreviewResult } from "../types";

const App: React.FC = () => {
  const api = useElectron();
  const { toggleTheme } = useTheme();
  const pendingPreviewRef = useRef<Promise<FilePreviewResult> | null>(null);

  // State management
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [dragDropFiles, setDragDropFiles] = useState<DragDropFile[]>([]);
  const [previewContent, setPreviewContent] = useState("");
  const [tokenCount, setTokenCount] = useState(0);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [currentTokenLimit, setCurrentTokenLimit] = useState(128000);

  // Generate preview whenever files change
  useEffect(() => {
    const generatePreview = async () => {
      if (selectedFiles.length === 0 && dragDropFiles.length === 0) {
        setPreviewContent("");
        setTokenCount(0);
        return;
      }

      setIsLoadingPreview(true);
      try {
        const previewPromise = api.generatePreview(
          selectedFiles,
          dragDropFiles
        );
        pendingPreviewRef.current = previewPromise;

        const result = await previewPromise;

        // Only update state if this is still the latest request
        if (pendingPreviewRef.current === previewPromise) {
          setPreviewContent(result.content);
          setTokenCount(result.tokenCount);
        }
      } catch (error) {
        console.error("Error generating preview:", error);
        if (pendingPreviewRef.current) {
          setPreviewContent("");
          setTokenCount(0);
        }
      } finally {
        setIsLoadingPreview(false);
      }
    };

    generatePreview();
  }, [selectedFiles, dragDropFiles, api]);

  // Handle file operations
  const handleFilesSelected = useCallback((files: string[]) => {
    setSelectedFiles((prev) => {
      const newFiles = files.filter((file) => !prev.includes(file));
      return [...prev, ...newFiles];
    });
  }, []);

  const handleDragDropFilesAdded = useCallback((files: DragDropFile[]) => {
    setDragDropFiles((prev) => {
      const newFiles = files.filter(
        (file) => !prev.some((existing) => existing.name === file.name)
      );
      return [...prev, ...newFiles];
    });
  }, []);

  const handleRemoveFile = useCallback(
    (index: number) => {
      const totalRegularFiles = selectedFiles.length;

      if (index < totalRegularFiles) {
        // Removing a regular file
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
      } else {
        // Removing a drag-and-drop file
        const dragIndex = index - totalRegularFiles;
        setDragDropFiles((prev) => prev.filter((_, i) => i !== dragIndex));
      }
    },
    [selectedFiles.length]
  );

  const handleClearAll = useCallback(() => {
    setSelectedFiles([]);
    setDragDropFiles([]);
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
              selectedFiles={selectedFiles}
              dragDropFiles={dragDropFiles}
              onFilesSelected={handleFilesSelected}
              onDragDropFilesAdded={handleDragDropFilesAdded}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAll}
            />
          </div>

          <ResizeHandle />

          <PreviewPane
            content={previewContent}
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
