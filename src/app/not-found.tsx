import type { Metadata } from "next";
import Link from "next/link";
import { NotFoundBackButton } from "./not-found-back-button";

export const metadata: Metadata = {
  title: "404 Not Found — Catalyst by Temasek",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0f1117] flex items-center justify-center">
      <div className="bg-white dark:bg-[#1e2130] rounded-2xl border border-gray-200 dark:border-gray-700 p-10 max-w-md w-full text-center shadow-sm">
        <div aria-hidden="true" className="text-5xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          The page you requested doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <NotFoundBackButton />
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
