import React from "react";
import type { Icon } from "@tabler/icons-react";

export type ButtonVariant = "primary" | "outline" | "danger" | "ghost" | "link";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: Icon;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  isLoading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm",
    outline:
      "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-gray-500",
    danger:
      "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm",
    ghost:
      "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-gray-500",
    link: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline-offset-4 hover:underline focus:ring-blue-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-base gap-1.5",
    md: "px-4 py-2 text-base gap-2",
    lg: "px-6 py-3 text-lg gap-2.5",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const widthClasses = fullWidth ? "w-full" : "";

  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClasses,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = iconSizes[size];
  const isDisabled = disabled || isLoading;

  const renderIcon = () => {
    if (isLoading) {
      return (
        <svg
          className="animate-spin"
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.25"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    if (Icon) {
      return <Icon size={iconSize} />;
    }

    return null;
  };

  const icon = renderIcon();

  return (
    <button className={combinedClasses} disabled={isDisabled} {...props}>
      {icon && iconPosition === "left" && icon}
      {children && <span className={icon ? "" : ""}>{children}</span>}
      {icon && iconPosition === "right" && icon}
    </button>
  );
};

export default Button;
