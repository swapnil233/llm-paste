import React, { useCallback, useRef, useEffect } from "react";

const ResizeHandle: React.FC = () => {
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isResizingRef.current = true;
    startXRef.current = e.clientX;

    const leftPanel = e.currentTarget.previousElementSibling as HTMLElement;
    if (leftPanel) {
      startWidthRef.current = leftPanel.offsetWidth;
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(
        300,
        Math.min(window.innerWidth * 0.7, startWidthRef.current + diff)
      );

      const leftPanel = document.querySelector(
        '[data-resize-panel="left"]'
      ) as HTMLElement;
      if (leftPanel) {
        leftPanel.style.width = `${newWidth}px`;
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-600 cursor-col-resize transition-colors relative select-none"
      onMouseDown={handleMouseDown}
    >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-5 bg-current opacity-30 rounded-full" />
    </div>
  );
};

export default ResizeHandle;
