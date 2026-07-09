"use client";
import React from "react";

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

  const elements: React.ReactNode[] = [];
  let listBuffer: Array<{ text: string; num?: number }> = [];
  let listIsOrdered = false;
  let key = 0;

  function flushList() {
    if (listBuffer.length > 0) {
      if (listIsOrdered) {
        elements.push(
          <ol key={key++} className="list-none space-y-1 my-2">
            {listBuffer.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0 font-medium w-4 text-right">{item.num ?? i + 1}.</span>
                <span dangerouslySetInnerHTML={{ __html: renderInline(item.text) }} />
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={key++} className="list-none space-y-1 my-2">
            {listBuffer.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">·</span>
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

  // Escape HTML first, then apply safe markdown-to-HTML transforms
  function renderInline(s: string): string {
    return escapeHtml(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="text-slate-200">$1</em>');
  }

  for (const line of lines) {
    if (!line) {
      flushList();
      continue;
    }

    // Quarter headers: only match action-plan structural labels like "Q1 (Months 1-3):" or "Q1:"
    // The colon must be at the END of the line (no content after it on the same line)
    if (/^(Q[1-4][\s(][^:]*:|Q[1-4]:)\s*$/i.test(line)) {
      flushList();
      elements.push(
        <div key={key++} className="text-sm font-semibold text-emerald-400 mt-5 mb-2 border-b border-emerald-600/20 pb-1">
          {line.replace(/^\*\*|\*\*$/g, "")}
        </div>
      );
      continue;
    }

    // Section headers: entire line wrapped in exactly one bold span (**text**), or ### style
    // Exclude lines like "**foo** and **bar**" that start AND end with ** but have inner ** pairs
    // Also exclude long prose lines that happen to be fully bolded (> 60 chars inner content)
    const isSingleBoldWrap = line.startsWith("**") && line.endsWith("**") && line.length > 4 &&
      line.slice(2, -2).indexOf("**") === -1 && line.slice(2, -2).length <= 60;
    if (isSingleBoldWrap || line.startsWith("### ")) {
      flushList();
      const content = line.replace(/^###\s*/, "").replace(/^\*\*|\*\*$/g, "");
      elements.push(
        <div key={key++} className="text-sm font-semibold text-white mt-4 mb-1.5">
          {content}
        </div>
      );
      continue;
    }

    // Bullet items: - or • or * at start
    if (/^[-•*]\s+/.test(line)) {
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
      listBuffer.push({ text: line.replace(/^\d+\.\s+/, ""), num: numMatch ? parseInt(numMatch[1]) : undefined });
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={key++} className="text-sm text-slate-300 leading-relaxed mb-2"
        dangerouslySetInnerHTML={{ __html: renderInline(line) }}
      />
    );
  }

  flushList();

  return (
    <div className={`bg-white/[0.02] border border-white/5 rounded-lg p-4 ${className}`}>
      {elements}
    </div>
  );
}
