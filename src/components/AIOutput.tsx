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

// Decode only the HTML entities that escapeHtml produces, then re-encode for safe href attribute use.
// This prevents &quot; in a Gemini-supplied URL from terminating the href="" attribute (XSS vector).
function safeHref(escapedUrl: string): string {
  // Decode the entities escapeHtml() introduced
  const raw = escapedUrl
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Only allow http/https URLs; reject anything else (javascript:, data:, etc.)
  if (!/^https?:\/\//i.test(raw)) return "#";
  // Re-escape the entire URL for safe insertion into href="..."
  // encodeURI preserves valid URL chars; then escape the remaining HTML-special chars.
  try {
    const encoded = encodeURI(decodeURI(raw));
    return encoded
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  } catch {
    return "#";
  }
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
  // XSS strategy: escapeHtml() runs FIRST — all Gemini-supplied angle brackets and entities
  // become &lt;/&gt;/&amp; before any regex touches the string. The markdown regexes then
  // inject only our own known-safe <strong>/<em>/<a> tags. No Gemini content can produce a
  // tag. The captures ($1 or replacement function arg) are already HTML-entity-encoded,
  // which is correct: the browser decodes &amp; → & when rendering innerHTML.
  function renderInline(s: string): string {
    return escapeHtml(s)
      // Markdown links must run BEFORE bold/italic regex so that ** inside URLs is never
      // converted to <strong> tags that break the URL pattern match.
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s<>"']+)\)/g, (_, label, url) =>
        `<a href="${safeHref(url)}" target="_blank" rel="noopener noreferrer" class="text-purple-700 underline break-all">${label}</a>`
      )
      .replace(/\*{3}(.+?)\*{3}/g, '<strong class="text-gray-900 font-semibold"><em class="text-gray-800">$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="text-gray-800">$1</em>')
      // Bare-URL step: skip URLs already inside href/src attributes (preceded by >").
      // Removed '=' from the lookbehind — it blocked prose like 'endpoint=https://...'
      .replace(/(?<![>"])(https?:\/\/[^\s<>"'*]+)/g, (rawUrl) => {
        // Strip trailing punctuation that belongs to the surrounding sentence, not the URL.
        let url = rawUrl.replace(/[.,;:!?]+$/, "");
        // Strip unmatched trailing ) using paren-balance counting — but re-emit them AFTER the
        // </a> tag so prose like "(https://example.com)" renders as "(<a>url</a>)" not "(<a>url</a".
        let open = 0, close = 0;
        for (const ch of url) { if (ch === "(") open++; else if (ch === ")") close++; }
        let suffix = "";
        while (close > open && url.endsWith(")")) { url = url.slice(0, -1); close--; suffix += ")"; }
        // url is already HTML-entity-encoded by the outer escapeHtml(s) pass — use it
        // directly as display text; calling escapeHtml(url) again would double-encode
        // entities like &amp; → &amp;amp; producing corrupted anchor text.
        return `<a href="${safeHref(url)}" target="_blank" rel="noopener noreferrer" class="text-purple-700 underline break-all">${url}</a>${suffix}`;
      });
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

    // Section headers: entire line wrapped in exactly one bold span (**text**), or ##/### style.
    // For # (single hash), require the first character after "# " to be uppercase to avoid matching
    // GRI codes (#305-1), statistics (#incidents), or comments (#this).
    const isSingleBoldWrap = line.startsWith("**") && line.endsWith("**") && line.length > 4 &&
      !line.startsWith("***") && !line.endsWith("***") &&
      line.slice(2, -2).indexOf("**") === -1 && line.slice(2, -2).length <= 160;
    const isHashHeading = (line.startsWith("### ") || line.startsWith("## ")) ||
      (line.startsWith("# ") && /^# [A-Z]/.test(line) && line.length <= 160);
    if (isSingleBoldWrap || isHashHeading) {
      flushList();
      const content = line.replace(/^#{1,3}\s*/, "").replace(/^\*\*|\*\*$/g, "");
      elements.push(
        <div key={key++} className="text-sm font-semibold text-gray-900 mt-4 mb-1.5"
          dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
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
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 wrap-anywhere break-words ${className}`}>
      {elements}
    </div>
  );
}
