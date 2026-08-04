"use client";
import { X } from "lucide-react";

export default function AppToast({
  message,
  onDismiss,
  className = "",
  messageClassName = "",
  dismissButtonClassName = "",
  contentClassName = "",
  dismissLabel = "Dismiss",
}) {
  if (!message) return null;

  return (
    <div className={className}>
      <div className={`w-full flex items-center gap-2.5 ${contentClassName}`}>
        <p className={`flex-1 min-w-0 break-words whitespace-normal leading-5 ${messageClassName}`}>{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`ml-auto shrink-0 ${dismissButtonClassName}`}
            aria-label={dismissLabel}
            title={dismissLabel}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

