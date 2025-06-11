import React, { useEffect, useState } from "react";
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useToast } from "../contexts/ToastContext";
import Button from "./Button";

const Toast: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
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
        return (
          <IconCheck size={20} className="text-green-600 dark:text-green-400" />
        );
      case "error":
        return (
          <IconAlertCircle
            size={20}
            className="text-red-600 dark:text-red-400"
          />
        );
      case "info":
        return (
          <IconInfoCircle
            size={20}
            className="text-blue-600 dark:text-blue-400"
          />
        );
      default:
        return (
          <IconInfoCircle
            size={20}
            className="text-blue-600 dark:text-blue-400"
          />
        );
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
        bg-white dark:bg-gray-800 border rounded-lg shadow-lg backdrop-blur-sm
        transform transition-all duration-300 ease-in-out
        ${
          isVisible && !isLeaving
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95"
        }
        min-w-80 max-w-md
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div
            className="text-base font-medium text-gray-900 dark:text-gray-100 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: toast.message }}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={IconX}
          onClick={handleClose}
          className="flex-shrink-0 ml-2 !p-1 rounded-full"
          aria-label="Close notification"
        />
      </div>
    </div>
  );
};

export default Toast;
