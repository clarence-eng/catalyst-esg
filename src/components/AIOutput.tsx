"use client";
import type { ReactNode } from "react";

interface AIOutputProps {
  text: string;
  className?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function AIOutput({ text, className = "" }: AIOutputProps) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim());

  const elements: ReactNode[] = [];
  let listBuffer: Array<{ text: string; num?: number }> = [];
  let listIsOrdered = false;
  let key = 0;

  function flushList() {
    if (listBuffer.length > 0) {
      if (listIsOrdered) {
        elements.push(
          <ol key={key++} role="list" className="list-none space-y-1 my-2">
            {listBuffer.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-700 mt-0.5 flex-shrink-0 font-medium min-w-[1.5rem] text-right">{item.num ?? i + 1}.</span>
                <span dangerouslySetInnerHTML={{ __html: renderInline(item.text) }} />
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={key++} role="list" className="list-none space-y-1 my-2">
            {listBuffer.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-700 mt-0.5 flex-shrink-0">·</span>
                <span dangerouslySetInnerHTML={{ __html: renderInline(item.text) }} />
              </li>
            ))}
          </ul>
        );
      }
      listBuffer = [];
      listIsOrdered = false;
    }
  }

  // Render inline markdown to safe HTML.
  // Apply markdown substitutions first (each substitution escapes its own capture group),
  // then escape any remaining plain text that contains HTML metacharacters.
  // This avoids double-encoding: &amp; inside **bold** stays as & not &amp;amp;
  function renderInline(s: string): string {
    const urlRe = /(https?:\/\/[^\s<>"'*]+)/g;
    const result = s
      .replace(/\*{3}(.+?)\*{3}/g, (_, t) => `<strong class="text-gray-900 font-semibold"><em class="text-gray-800">${escapeHtml(t)}</em></strong>`)
      .replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong class="text-gray-900 font-semibold">${escapeHtml(t)}</strong>`)
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_, t) => `<em class="text-gray-800">${escapeHtml(t)}</em>`)
      .replace(urlRe, (url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-purple-700 underline break-all">${escapeHtml(url)}</a>`);
    // Escape remaining plain text segments (those not inside injected tags)
    // Split on tag boundaries and escape non-tag segments
    return result.replace(/(<[^>]+>)|([^<]+)/g, (_, tag, text) =>
      tag ? tag : escapeHtml(text)
    );
  }

  for (const line of lines) {
    if (!line) {
      flushList();
      continue;
    }

    // Quarter headers: match "Q1 (Months 1-3):" or "Q1:" bare or bold-wrapped (**Q1 (...):**)
    const normalizedLine = line.replace(/^\*\*|\*\*$/g, "").trim();
    if (/^(Q[1-4]\s*\([^)]*\)\s*:|Q[1-4]\s*:)/i.test(normalizedLine) && !/^Q[1-4]\s+[A-Z][^:]*:/i.test(normalizedLine)) {
      flushList();
      elements.push(
        <div key={key++} className="text-sm font-semibold text-emerald-700 mt-5 mb-2 border-b border-emerald-600/20 pb-1">
          {normalizedLine}
        </div>
      );
      continue;
    }

    // Section headers: entire line wrapped in exactly one bold span (**text**), or ### style
    // Exclude lines like "**foo** and **bar**" that start AND end with ** but have inner ** pairs
    // Exclude ***bold-italic*** which starts/ends with ** but has leading/trailing * inside
    // Also exclude long prose lines that happen to be fully bolded (> 60 chars inner content)
    const isSingleBoldWrap = line.startsWith("**") && line.endsWith("**") && line.length > 4 &&
      !line.startsWith("***") && !line.endsWith("***") &&
      line.slice(2, -2).indexOf("**") === -1 && line.slice(2, -2).length <= 160;
    if (isSingleBoldWrap || line.startsWith("### ")) {
      flushList();
      const content = line.replace(/^###\s*/, "").replace(/^\*\*|\*\*$/g, "");
      elements.push(
        <div key={key++} className="text-sm font-semibold text-gray-900 mt-4 mb-1.5">
          {content}
        </div>
      );
      continue;
    }

    // Bullet items: - or • at start, or * at start (any content, including bold-starting items)
    // Only exclude lines that are ENTIRELY wrapped in bold: **text** (those are section headers above)
    if (/^[-•]\s+|^\*\s+/.test(line)) {
      if (listIsOrdered && listBuffer.length > 0) flushList();
      listIsOrdered = false;
      listBuffer.push({ text: line.replace(/^[-•*]\s+/, "") });
      continue;
    }

    // Numbered list items: "1." "2." etc — preserve original number
    if (/^\d+\.\s+/.test(line)) {
      if (!listIsOrdered && listBuffer.length > 0) flushList();
      listIsOrdered = true;
      const numMatch = line.match(/^(\d+)\.\s+/);
      listBuffer.push({ text: line.replace(/^\d+\.\s+/, ""), num: numMatch ? parseInt(numMatch[1], 10) : undefined });
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={key++} className="text-sm text-gray-700 leading-relaxed mb-2"
        dangerouslySetInnerHTML={{ __html: renderInline(line) }}
      />
    );
  }

  flushList();

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-wrap-anywhere break-words ${className}`}>
      {elements}
    </div>
  );
}
