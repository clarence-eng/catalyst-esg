"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Catalyst] Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center shadow-sm">
        <div className="text-4xl font-bold text-red-200 mb-4">⚠</div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-6">
          An unexpected error occurred. This may be a temporary connectivity issue.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="bg-[#4B2580] text-white text-sm px-5 py-2.5 rounded-lg hover:bg-[#3D1A6E] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm text-gray-600 border border-gray-200 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Overview
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
