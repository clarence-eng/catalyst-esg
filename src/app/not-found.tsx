"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center shadow-sm">
        <div className="text-5xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-6">
          The page you requested doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-sm text-gray-600 border border-gray-200 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go back
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#4B2580] text-white text-sm px-5 py-2.5 rounded-lg hover:bg-[#3D1A6E] transition-colors"
          >
            Back to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
