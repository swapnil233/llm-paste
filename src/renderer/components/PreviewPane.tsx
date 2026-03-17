import React, { useState, useCallback, useRef } from "react";
import { IconCopy, IconDeviceFloppy } from "@tabler/icons-react";
import { useElectron } from "../hooks/useElectron";
import { useToast } from "../contexts/ToastContext";
import Button from "./Button";
import type { TokenLimit } from "../types";

interface PreviewPaneProps {
  content: string;
  tokenCount: number;
  isLoading: boolean;
  comparisonTokenLimit: number;
  onTokenLimitChange: (limit: number) => void;
}

const TOKEN_LIMITS: TokenLimit[] = [
  { value: 128000, label: "GPT-4o (128k)" },
  { value: 1048576, label: "Gemini 2.5 Pro (1M)" },
  { value: 200000, label: "Claude models (200k)" },
];

const PreviewPane: React.FC<PreviewPaneProps> = ({
  content,
  tokenCount,
  isLoading,
  comparisonTokenLimit,
  onTokenLimitChange,
}) => {
  const api = useElectron();
  const { showToast } = useToast();
  const [isCopying, setIsCopying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const previewRef = useRef<HTMLPreElement>(null);

  const hasContent = content.length > 0;
  const percentage = Math.min(
    (tokenCount / comparisonTokenLimit) * 100,
    100
  );

  const handleCopy = useCallback(async () => {
    if (!hasContent || isCopying) return;

    setIsCopying(true);
    try {
      await api.copyToClipboard(content);
      showToast("Content copied to clipboard!", "success");
    } catch (error) {
      showToast(`Error copying to clipboard: ${error}`, "error");
    } finally {
      setIsCopying(false);
    }
  }, [api, content, hasContent, isCopying, showToast]);

  const handleSave = useCallback(async () => {
    if (!hasContent || isSaving) return;

    setIsSaving(true);
    try {
      const result = await api.combineFiles(content);
      showToast(`Saved to ${result.dest}`, "success", 5000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.includes("Save cancelled")) {
        showToast(`Error saving file: ${msg}`, "error");
      }
    } finally {
      setIsSaving(false);
    }
  }, [api, content, hasContent, isSaving, showToast]);

  const handleTokenLimitChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onTokenLimitChange(parseInt(e.target.value));
    },
    [onTokenLimitChange]
  );

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex flex-col min-w-0">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4 justify-between w-full">
            {/* Token Count with Status Circle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    percentage <= 75
                      ? "bg-green-500"
                      : percentage <= 90
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                  {isLoading
                    ? "Calculating..."
                    : `${tokenCount.toLocaleString()} / ${comparisonTokenLimit.toLocaleString()} tokens`}
                </span>
              </div>
              <select
                value={comparisonTokenLimit}
                onChange={handleTokenLimitChange}
                className="text-base bg-white dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300"
                aria-label="Compare token count against model context limit"
              >
                {TOKEN_LIMITS.map((limit) => (
                  <option key={limit.value} value={limit.value}>
                    {limit.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            {hasContent && (
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  icon={IconCopy}
                  onClick={handleCopy}
                  isLoading={isCopying}
                  aria-label="Copy content to clipboard"
                >
                  {isCopying ? "Copying..." : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  icon={IconDeviceFloppy}
                  onClick={handleSave}
                  isLoading={isSaving}
                  aria-label="Save content to file"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-hidden p-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <div className="text-base text-gray-600 dark:text-gray-400">
                  Loading content...
                </div>
              </div>
            </div>
          ) : hasContent ? (
            <pre
              className="preview-content h-full overflow-y-auto text-sm font-mono bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 whitespace-pre-wrap text-gray-800 dark:text-gray-200"
              ref={previewRef}
            >
              {content}
            </pre>
          ) : (
            <div className="text-base text-gray-500 dark:text-gray-400 text-center py-8">
              Combined content will appear here when you select files
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewPane;
