import React, { useEffect, useState } from "react";
import { useToast } from "../contexts/ToastContext";

const Toast: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: {
    id: string;
    message: string;
    type: "success" | "error" | "info";
  };
  onRemove: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Enter animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onRemove, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "info":
        return "ℹ️";
      default:
        return "ℹ️";
    }
  };

  const getTypeClasses = () => {
    switch (toast.type) {
      case "success":
        return "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20";
      case "error":
        return "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20";
      case "info":
        return "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20";
      default:
        return "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20";
    }
  };

  return (
    <div
      className={`
                ${getTypeClasses()}
                bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3 max-w-sm
                transform transition-all duration-300 ease-in-out
                ${
                  isVisible && !isLeaving
                    ? "translate-x-0 opacity-100"
                    : "translate-x-full opacity-0"
                }
            `}
    >
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div
          className="text-sm text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: toast.message }}
        />
        <button
          onClick={handleClose}
          className="ml-auto text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
