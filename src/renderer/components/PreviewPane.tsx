import React, { useState, useCallback } from "react";
import { useElectron } from "../hooks/useElectron";
import { useToast } from "../contexts/ToastContext";
import type { TokenLimit } from "../types";

interface PreviewPaneProps {
  content: string;
  tokenCount: number;
  isLoading: boolean;
  currentTokenLimit: number;
  onTokenLimitChange: (limit: number) => void;
}

const TOKEN_LIMITS: TokenLimit[] = [
  { value: 128000, label: "GPT-4 (128k)" },
  { value: 32000, label: "GPT-3.5 (32k)" },
  { value: 1048576, label: "Gemini 2.5 Pro (1M)" },
  { value: 200000, label: "Claude 3.5 (200k)" },
  { value: 8192, label: "GPT-4 8k" },
];

const PreviewPane: React.FC<PreviewPaneProps> = ({
  content,
  tokenCount,
  isLoading,
  currentTokenLimit,
  onTokenLimitChange,
}) => {
  const api = useElectron();
  const { showToast } = useToast();
  const [isCopying, setIsCopying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasContent = content.length > 0;
  const percentage = Math.min((tokenCount / currentTokenLimit) * 100, 100);

  const formatTokenLimit = (limit: number): string => {
    if (limit >= 1000000) return `${Math.round(limit / 1000000)}M`;
    if (limit >= 1000) return `${Math.round(limit / 1000)}k`;
    return limit.toString();
  };

  const getProgressBarClasses = (): string => {
    if (percentage >= 95) {
      return "h-full bg-red-500 transition-all duration-300 rounded-full animate-pulse";
    } else if (percentage >= 80) {
      return "h-full bg-yellow-500 transition-all duration-300 rounded-full animate-pulse";
    }
    return "h-full bg-green-500 transition-all duration-300 rounded-full";
  };

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
      showToast(`Error saving file: ${error}`, "error");
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
          <div className="flex items-center gap-4">
            <span className="text-base font-medium text-gray-700 dark:text-gray-300">
              Preview
            </span>

            {/* Token Progress Pill */}
            <div className="flex items-center gap-2">
              <div className="relative bg-gray-200 dark:bg-gray-700 rounded-full h-6 w-32 overflow-hidden">
                <div
                  className={getProgressBarClasses()}
                  style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {isLoading
                      ? "Calculating..."
                      : `${tokenCount.toLocaleString()} / ${formatTokenLimit(
                          currentTokenLimit
                        )}`}
                  </span>
                </div>
              </div>
              <select
                value={currentTokenLimit}
                onChange={handleTokenLimitChange}
                className="text-xs bg-white dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300"
              >
                {TOKEN_LIMITS.map((limit) => (
                  <option key={limit.value} value={limit.value}>
                    {limit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!hasContent || isCopying}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {isCopying ? "Copying..." : "Copy to Clipboard"}
            </button>
            <button
              onClick={handleSave}
              disabled={!hasContent || isSaving}
              className="btn-outline text-sm disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save .txt"}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-4">
        {hasContent ? (
          <pre className="preview-content h-full overflow-y-auto p-4 text-base bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            {content}
          </pre>
        ) : (
          <div className="text-base text-gray-500 dark:text-gray-400 text-center py-8">
            Combined content will appear here when you select files
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPane;
