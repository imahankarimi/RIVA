"use client";

import { cn } from "@/lib/utils";

/**
 * SimpleMarkdownRenderer
 *
 * A lightweight markdown renderer without external dependencies.
 * Handles common formatting for AI responses:
 * - Headings (# ## ###)
 * - Bold (**text**)
 * - Italic (*text*)
 * - Code (`code`)
 * - Lists (- item)
 * - Links ([text](url))
 */
export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = (index: number) => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`list-${index}`} className="my-2 ml-4 space-y-1 text-[14px] text-ink first:mt-0 last:mb-0">
            {listItems.map((item, i) => (
              <li key={i} className="leading-relaxed marker:text-ink-soft">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      // Headings
      if (line.startsWith("### ")) {
        flushList(index);
        elements.push(
          <h3 key={index} className="mt-3 mb-1.5 text-[14px] font-semibold text-ink leading-snug first:mt-0">
            {renderInline(line.slice(4))}
          </h3>
        );
      } else if (line.startsWith("## ")) {
        flushList(index);
        elements.push(
          <h2 key={index} className="mt-3 mb-2 text-[15px] font-semibold text-ink leading-snug first:mt-0">
            {renderInline(line.slice(3))}
          </h2>
        );
      } else if (line.startsWith("# ")) {
        flushList(index);
        elements.push(
          <h1 key={index} className="mt-4 mb-2 text-[17px] font-semibold text-ink leading-snug first:mt-0">
            {renderInline(line.slice(2))}
          </h1>
        );
      }
      // Lists
      else if (line.match(/^[-*]\s+/)) {
        if (!inList) {
          inList = true;
        }
        listItems.push(line.replace(/^[-*]\s+/, ""));
      }
      // Empty line
      else if (line.trim() === "") {
        flushList(index);
      }
      // Regular paragraph
      else {
        flushList(index);
        elements.push(
          <p key={index} className="my-2 text-[14px] leading-relaxed text-ink first:mt-0 last:mb-0">
            {renderInline(line)}
          </p>
        );
      }
    });

    flushList(lines.length);
    return elements;
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch) {
        const before = remaining.slice(0, boldMatch.index);
        if (before) parts.push(before);
        parts.push(
          <strong key={key++} className="font-semibold text-ink">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice((boldMatch.index || 0) + boldMatch[0].length);
        continue;
      }

      // Italic *text*
      const italicMatch = remaining.match(/\*(.+?)\*/);
      if (italicMatch) {
        const before = remaining.slice(0, italicMatch.index);
        if (before) parts.push(before);
        parts.push(
          <em key={key++} className="italic text-ink">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice((italicMatch.index || 0) + italicMatch[0].length);
        continue;
      }

      // Inline code `code`
      const codeMatch = remaining.match(/`(.+?)`/);
      if (codeMatch) {
        const before = remaining.slice(0, codeMatch.index);
        if (before) parts.push(before);
        parts.push(
          <code key={key++} className="rounded bg-surfaceMuted px-1.5 py-0.5 text-[13px] font-mono text-ink">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice((codeMatch.index || 0) + codeMatch[0].length);
        continue;
      }

      // Links [text](url)
      const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);
      if (linkMatch) {
        const before = remaining.slice(0, linkMatch.index);
        if (before) parts.push(before);
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-signal-600 underline decoration-signal-200 underline-offset-2 transition-colors hover:text-signal-700 hover:decoration-signal-400"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice((linkMatch.index || 0) + linkMatch[0].length);
        continue;
      }

      // No more matches
      parts.push(remaining);
      break;
    }

    return parts;
  };

  return <div className={cn("prose prose-sm max-w-none", className)}>{renderContent(content)}</div>;
}
