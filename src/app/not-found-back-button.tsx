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
      className="text-sm text-gray-600 border border-gray-200 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
    >
      Go back
    </button>
  );
}
