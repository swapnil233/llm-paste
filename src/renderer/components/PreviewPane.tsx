import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useElectron } from "../hooks/useElectron";
import { useToast } from "../contexts/ToastContext";
import type { TokenLimit } from "../types";

interface PreviewPaneProps {
  content: string;
  files: string[];
  tokenCount: number;
  isLoading: boolean;
  currentTokenLimit: number;
  onTokenLimitChange: (limit: number) => void;
}

interface FileSection {
  name: string;
  startIndex: number;
  endIndex: number;
  lineCount: number;
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
  files,
  tokenCount,
  isLoading,
  currentTokenLimit,
  onTokenLimitChange,
}) => {
  const api = useElectron();
  const { showToast } = useToast();
  const [isCopying, setIsCopying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>("");
  const previewRef = useRef<HTMLDivElement>(null);

  const hasContent = content.length > 0;
  const percentage = Math.min((tokenCount / currentTokenLimit) * 100, 100);
  const totalLines = content.split("\n").length;
  const isLargeContent = totalLines > 1000;

  // Performance optimization: disable syntax highlighting for very large content
  const MAX_LINES_FOR_HIGHLIGHT = 8000;
  const shouldHighlight = totalLines < MAX_LINES_FOR_HIGHLIGHT;

  // Create file sections from the actual file list instead of parsing content
  const fileSections = useMemo((): FileSection[] => {
    if (!content || files.length === 0) return [];

    const lines = content.split("\n");
    const sections: FileSection[] = [];

    // Look for each file in the content
    files.forEach((fileName) => {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] === fileName) {
          // Found the file header, now find where it ends
          let endIndex = lines.length - 1;

          // Look for the next file header
          for (let j = i + 1; j < lines.length; j++) {
            if (files.includes(lines[j])) {
              endIndex = j - 1;
              break;
            }
          }

          sections.push({
            name: fileName,
            startIndex: i,
            endIndex,
            lineCount: endIndex - i + 1,
          });
          break; // Move to next file
        }
      }
    });

    return sections;
  }, [content, files]);

  // Scroll to specific section
  const scrollToSection = useCallback(
    (sectionName: string) => {
      if (!previewRef.current) return;

      const section = fileSections.find((s) => s.name === sectionName);
      if (!section) return;

      const lineHeight = 20; // Approximate line height
      const scrollTop = section.startIndex * lineHeight;

      previewRef.current.scrollTop = scrollTop;
      setCurrentSection(sectionName);
    },
    [fileSections, content]
  );

  // Track current section while scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!previewRef.current || fileSections.length === 0) return;

      const scrollTop = previewRef.current.scrollTop;
      const lineHeight = 20; // Approximate line height
      const currentLine = Math.floor(scrollTop / lineHeight);

      // Find which section we're currently viewing
      for (const section of fileSections) {
        if (
          currentLine >= section.startIndex &&
          currentLine <= section.endIndex
        ) {
          setCurrentSection(section.name);
          break;
        }
      }
    };

    const previewElement = previewRef.current;
    if (previewElement) {
      previewElement.addEventListener("scroll", handleScroll);
      return () => previewElement.removeEventListener("scroll", handleScroll);
    }
  }, [fileSections]);

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
              <div
                className="relative bg-gray-200 dark:bg-gray-700 rounded-full h-6 w-32 overflow-hidden"
                role="progressbar"
                aria-valuenow={tokenCount}
                aria-valuemin={0}
                aria-valuemax={currentTokenLimit}
                aria-label={`Token usage: ${tokenCount.toLocaleString()} of ${formatTokenLimit(
                  currentTokenLimit
                )} tokens (${percentage.toFixed(1)}%)`}
              >
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
                aria-label="Select token limit for comparison"
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
            {isLargeContent && fileSections.length > 1 && (
              <button
                onClick={() => setShowNavigation(!showNavigation)}
                className="btn-outline text-sm flex items-center gap-1"
                aria-label="Toggle file navigation"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
                Navigation
              </button>
            )}
            <button
              onClick={handleCopy}
              disabled={!hasContent || isCopying}
              className="btn-primary text-sm disabled:opacity-50"
              aria-label="Copy content to clipboard"
            >
              {isCopying ? "Copying..." : "Copy to Clipboard"}
            </button>
            <button
              onClick={handleSave}
              disabled={!hasContent || isSaving}
              className="btn-outline text-sm disabled:opacity-50"
              aria-label="Save content as text file"
            >
              {isSaving ? "Saving..." : "Save .txt"}
            </button>
          </div>
        </div>
      </div>

      {/* Current Section Indicator */}
      {isLargeContent && currentSection && (
        <div className="sticky top-0 z-10 bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
          <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 truncate">
            📁 {currentSection.split(/[/\\]/).pop() || currentSection}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Navigation Sidebar */}
        {showNavigation && isLargeContent && fileSections.length > 1 && (
          <div className="w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                File Navigation ({fileSections.length} files)
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {fileSections.map((section, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSection(section.name)}
                  className={`w-full text-left p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    currentSection === section.name
                      ? "bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500"
                      : ""
                  }`}
                  aria-label={`Navigate to file ${section.name}`}
                  aria-current={
                    currentSection === section.name ? "true" : undefined
                  }
                >
                  <div
                    className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate"
                    title={section.name}
                  >
                    {section.name.split(/[/\\]/).pop() || section.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {section.lineCount} lines
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
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
            <div
              className="preview-content h-full overflow-y-auto text-base bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4"
              ref={previewRef}
            >
              {shouldHighlight ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    pre: ({ ...props }) => (
                      <pre
                        {...props}
                        className="overflow-x-auto rounded bg-gray-800 text-gray-100 p-4 my-4"
                      />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <pre className="preview-content-raw whitespace-pre-wrap font-mono text-sm p-4">
                  {content}
                </pre>
              )}
            </div>
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
