"use client";
import { useState, useEffect } from "react";

export function NotFoundBackButton() {
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  if (!canGoBack) return null;

  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 px-5 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      Go back
    </button>
  );
}
