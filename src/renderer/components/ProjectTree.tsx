import React, { useState, useCallback, useMemo } from "react";
import type { TreeNode } from "../types";
import getFileIcon from "../../utils/getFileIcon";
import Button from "./Button";
import {
  IconFolderOpen,
  IconFolder,
  IconChevronRight,
  IconChevronDown,
  IconRefresh,
  IconFolderPlus,
} from "@tabler/icons-react";

interface ProjectTreeProps {
  tree: TreeNode | null;
  checkedPaths: Set<string>;
  tokenCounts: Record<string, number>;
  onOpenProject: () => void;
  onCheckedChange: (paths: Set<string>) => void;
}

// Collect all file paths from a tree node
function collectFilePaths(node: TreeNode): string[] {
  if (node.type === "file") return [node.path];
  if (!node.children) return [];
  return node.children.flatMap(collectFilePaths);
}

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  checkedPaths: Set<string>;
  expandedPaths: Set<string>;
  tokenCounts: Record<string, number>;
  onToggleCheck: (node: TreeNode) => void;
  onToggleExpand: (path: string) => void;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  depth,
  checkedPaths,
  expandedPaths,
  tokenCounts,
  onToggleCheck,
  onToggleExpand,
}) => {
  const isDir = node.type === "directory";
  const isExpanded = expandedPaths.has(node.path);

  // Determine check state for this node
  const checkState = useMemo(() => {
    if (node.type === "file") {
      return checkedPaths.has(node.path) ? "checked" : "unchecked";
    }
    const allFiles = collectFilePaths(node);
    if (allFiles.length === 0) return "unchecked";
    const checkedCount = allFiles.filter((p) => checkedPaths.has(p)).length;
    if (checkedCount === 0) return "unchecked";
    if (checkedCount === allFiles.length) return "checked";
    return "indeterminate";
  }, [node, checkedPaths]);

  // Sum token counts for directories
  const tokenCount = useMemo(() => {
    if (node.type === "file") return tokenCounts[node.path] || 0;
    const allFiles = collectFilePaths(node);
    return allFiles
      .filter((p) => checkedPaths.has(p))
      .reduce((sum, p) => sum + (tokenCounts[p] || 0), 0);
  }, [node, tokenCounts, checkedPaths]);

  return (
    <>
      <div
        className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer select-none group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isDir) onToggleExpand(node.path);
        }}
      >
        {/* Expand/collapse arrow for directories */}
        <span className="w-4 h-4 flex items-center justify-center mr-1 shrink-0">
          {isDir ? (
            isExpanded ? (
              <IconChevronDown size={14} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <IconChevronRight size={14} className="text-gray-500 dark:text-gray-400" />
            )
          ) : null}
        </span>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={checkState === "checked"}
          ref={(el) => {
            if (el) el.indeterminate = checkState === "indeterminate";
          }}
          onChange={(e) => {
            e.stopPropagation();
            onToggleCheck(node);
          }}
          onClick={(e) => e.stopPropagation()}
          className="mr-2 shrink-0 w-4 h-4 rounded border-gray-300 dark:border-gray-500 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />

        {/* Icon */}
        <span className="mr-2 shrink-0 flex items-center">
          {isDir ? (
            isExpanded ? (
              <IconFolderOpen size={18} className="text-blue-500" />
            ) : (
              <IconFolder size={18} className="text-blue-400" />
            )
          ) : (
            getFileIcon(node.path)
          )}
        </span>

        {/* Name */}
        <span
          className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate font-mono"
          title={node.path}
        >
          {node.name}
        </span>

        {/* Token count badge */}
        {tokenCount > 0 && checkState !== "unchecked" && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 shrink-0">
            {tokenCount.toLocaleString()}
          </span>
        )}
      </div>

      {/* Render children if expanded */}
      {isDir && isExpanded && node.children && (
        <>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              checkedPaths={checkedPaths}
              expandedPaths={expandedPaths}
              tokenCounts={tokenCounts}
              onToggleCheck={onToggleCheck}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </>
      )}
    </>
  );
};

const ProjectTree: React.FC<ProjectTreeProps> = ({
  tree,
  checkedPaths,
  tokenCounts,
  onOpenProject,
  onCheckedChange,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-expand root when tree changes
  React.useEffect(() => {
    if (tree) {
      setExpandedPaths(new Set([tree.path]));
    }
  }, [tree]);

  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleToggleCheck = useCallback(
    (node: TreeNode) => {
      const filePaths = collectFilePaths(node);
      const allChecked = filePaths.every((p) => checkedPaths.has(p));

      const next = new Set(checkedPaths);
      if (allChecked) {
        filePaths.forEach((p) => next.delete(p));
      } else {
        filePaths.forEach((p) => next.add(p));
      }
      onCheckedChange(next);
    },
    [checkedPaths, onCheckedChange]
  );

  const handleClearAll = useCallback(() => {
    onCheckedChange(new Set());
  }, [onCheckedChange]);

  // Filter tree to only show matching nodes
  const filteredTree = useMemo(() => {
    if (!tree || !searchQuery.trim()) return tree;
    const query = searchQuery.toLowerCase();

    function filterNode(node: TreeNode): TreeNode | null {
      if (node.type === "file") {
        return node.name.toLowerCase().includes(query) ? node : null;
      }
      if (!node.children) return null;
      const filteredChildren = node.children
        .map(filterNode)
        .filter(Boolean) as TreeNode[];
      if (filteredChildren.length === 0) return null;
      return { ...node, children: filteredChildren };
    }

    return filterNode(tree);
  }, [tree, searchQuery]);

  // Auto-expand all when searching
  React.useEffect(() => {
    if (searchQuery.trim() && filteredTree) {
      const allDirs = new Set<string>();
      const gatherDirs = (node: TreeNode) => {
        if (node.type === "directory") {
          allDirs.add(node.path);
          node.children?.forEach(gatherDirs);
        }
      };
      gatherDirs(filteredTree);
      setExpandedPaths(allDirs);
    }
  }, [searchQuery, filteredTree]);

  const selectedCount = checkedPaths.size;

  return (
    <div className="bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex justify-between items-center mb-3">
          <span className="text-base font-medium text-gray-700 dark:text-gray-300">
            {tree ? tree.name : "No Project"}
            {selectedCount > 0 && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({selectedCount} file{selectedCount !== 1 ? "s" : ""} selected)
              </span>
            )}
          </span>
          <div className="flex gap-2">
            {tree && (
              <Button
                variant="danger"
                size="sm"
                icon={IconRefresh}
                onClick={handleClearAll}
                disabled={selectedCount === 0}
                aria-label="Clear all selections"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={IconFolderPlus}
          onClick={onOpenProject}
          fullWidth
          aria-label="Open a project folder"
        >
          {tree ? "Change Project" : "Open Project"}
        </Button>

        {/* Search */}
        {tree && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {filteredTree ? (
          filteredTree.children && filteredTree.children.length > 0 ? (
            filteredTree.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                depth={0}
                checkedPaths={checkedPaths}
                expandedPaths={expandedPaths}
                tokenCounts={tokenCounts}
                onToggleCheck={handleToggleCheck}
                onToggleExpand={handleToggleExpand}
              />
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              {searchQuery ? "No matching files" : "No supported files found"}
            </div>
          )
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8 px-4">
            Open a project folder to browse and select files
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTree;
