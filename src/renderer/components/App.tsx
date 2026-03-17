import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useElectron } from "../hooks/useElectron";
import { useTheme } from "../hooks/useTheme";
import { ToastProvider, useToast } from "../contexts/ToastContext";
import ProjectTree from "./ProjectTree";
import PreviewPane from "./PreviewPane";
import ResizeHandle from "./ResizeHandle";
import Toast from "./Toast";
import Button from "./Button";
import { IconMoon, IconSun } from "@tabler/icons-react";
import type { TreeNode } from "../types";

const AppContent: React.FC = () => {
  const api = useElectron();
  const { isDark, toggleTheme, isInitialized } = useTheme();
  const { showToast } = useToast();
  const previewRequestId = useRef(0);

  const [tree, setTree] = useState<TreeNode | null>(null);
  const [checkedPaths, setCheckedPaths] = useState<Set<string>>(new Set());
  const [tokenCounts, setTokenCounts] = useState<Record<string, number>>({});
  const [previewContent, setPreviewContent] = useState("");
  const [tokenCount, setTokenCount] = useState(0);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [comparisonTokenLimit, setComparisonTokenLimit] = useState(128000);

  const checkedPathsList = useMemo(
    () => Array.from(checkedPaths).sort(),
    [checkedPaths]
  );
  const checkedPathsKey = useMemo(
    () => checkedPathsList.join("\n"),
    [checkedPathsList]
  );

  // Generate preview whenever checked files change
  useEffect(() => {
    const run = async () => {
      const requestId = ++previewRequestId.current;

      if (checkedPathsList.length === 0) {
        setPreviewContent("");
        setTokenCount(0);
        setTokenCounts({});
        setIsLoadingPreview(false);
        return;
      }

      setIsLoadingPreview(true);

      try {
        const result = await api.generatePreview(checkedPathsList, []);
        if (previewRequestId.current !== requestId) return;

        setPreviewContent(result.content);
        setTokenCount(result.tokenCount);
        setTokenCounts(result.fileTokenCounts);
      } catch (error) {
        if (previewRequestId.current !== requestId) return;
        console.error("Error generating preview:", error);
        setPreviewContent("");
        setTokenCount(0);
        setTokenCounts({});
      } finally {
        if (previewRequestId.current === requestId) {
          setIsLoadingPreview(false);
        }
      }
    };

    void run();
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
                icon={isDark ? IconSun : IconMoon}
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
              comparisonTokenLimit={comparisonTokenLimit}
              onTokenLimitChange={setComparisonTokenLimit}
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
