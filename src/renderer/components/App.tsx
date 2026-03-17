import React, { useState, useEffect, useCallback, useRef } from "react";
import { useElectron } from "../hooks/useElectron";
import { useTheme } from "../hooks/useTheme";
import { ToastProvider, useToast } from "../contexts/ToastContext";
import ProjectTree from "./ProjectTree";
import PreviewPane from "./PreviewPane";
import ResizeHandle from "./ResizeHandle";
import Toast from "./Toast";
import Button from "./Button";
import { IconMoon } from "@tabler/icons-react";
import type { TreeNode, FilePreviewResult } from "../types";

const AppContent: React.FC = () => {
  const api = useElectron();
  const { toggleTheme, isInitialized } = useTheme();
  const { showToast } = useToast();
  const pendingPreviewRef = useRef<Promise<FilePreviewResult> | null>(null);

  const [tree, setTree] = useState<TreeNode | null>(null);
  const [checkedPaths, setCheckedPaths] = useState<Set<string>>(new Set());
  const [tokenCounts, setTokenCounts] = useState<Record<string, number>>({});
  const [previewContent, setPreviewContent] = useState("");
  const [tokenCount, setTokenCount] = useState(0);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [currentTokenLimit, setCurrentTokenLimit] = useState(128000);

  // Convert checked paths to a stable key for the effect dependency
  const checkedPathsKey = Array.from(checkedPaths).sort().join("\n");

  // Generate preview whenever checked files change
  useEffect(() => {
    const generatePreview = async () => {
      const selectedFiles = Array.from(checkedPaths);

      if (selectedFiles.length === 0) {
        setPreviewContent("");
        setTokenCount(0);
        return;
      }

      setIsLoadingPreview(true);
      try {
        const previewPromise = api.generatePreview(selectedFiles, []);
        pendingPreviewRef.current = previewPromise;

        const result = await previewPromise;

        if (pendingPreviewRef.current === previewPromise) {
          setPreviewContent(result.content);
          setTokenCount(result.tokenCount);
          setTokenCounts(result.fileTokenCounts);
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
  }, [checkedPathsKey, api]);

  const handleOpenProject = useCallback(async () => {
    try {
      const result = await api.openProject();
      if (result) {
        setTree(result as TreeNode);
        setCheckedPaths(new Set());
        setTokenCounts({});
        showToast(`Opened project: ${result.name}`, "success");
      }
    } catch (error) {
      showToast(`Error opening project: ${error}`, "error");
    }
  }, [api, showToast]);

  const handleCheckedChange = useCallback((paths: Set<string>) => {
    setCheckedPaths(paths);
  }, []);

  return (
    <>
      {!isInitialized ? (
        <div className="h-screen flex items-center justify-center bg-gray-100">
          <div className="text-gray-600">Loading...</div>
        </div>
      ) : (
        <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 px-6 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  LLM Paste
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  Open a project and select files to combine for LLM input
                </p>
              </div>
              <Button
                variant="ghost"
                icon={IconMoon}
                onClick={toggleTheme}
                className="!p-2"
                aria-label="Toggle theme"
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            <div
              data-resize-panel="left"
              style={{ width: "50%", minWidth: "300px", maxWidth: "70%" }}
            >
              <ProjectTree
                tree={tree}
                checkedPaths={checkedPaths}
                tokenCounts={tokenCounts}
                onOpenProject={handleOpenProject}
                onCheckedChange={handleCheckedChange}
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
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
