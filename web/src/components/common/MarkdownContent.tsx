import React from 'react';

interface Props {
  content: string;
  className?: string;
}

/**
 * Robust, zero-dependency Markdown renderer for DSA problem descriptions.
 * Handles headings (###, **Heading:**), lists (- or 1.), bold (**bold**), code (`code`), and paragraphs.
 */
export function MarkdownContent({ content, className = '' }: Props) {
  if (!content) return null;

  // Split content into blocks by 2+ consecutive newlines
  const rawBlocks = content.split(/\n\s*\n/);

  return (
    <div className={`space-y-3.5 ${className}`}>
      {rawBlocks.map((block, blockIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const lines = trimmed.split('\n');

        return (
          <div key={blockIdx} className="space-y-1.5">
            {lines.map((rawLine, lineIdx) => {
              const line = rawLine.trim();
              if (!line) return null;

              // 1. Markdown heading (# Heading, ## Heading, ### Heading)
              const mdHeadingMatch = line.match(/^(#{1,6})\s+(.+)$/);
              if (mdHeadingMatch) {
                const level = mdHeadingMatch[1].length;
                const text = mdHeadingMatch[2];
                return (
                  <h3
                    key={lineIdx}
                    className={`font-semibold text-lab-ink tracking-tight ${
                      level <= 2 ? 'text-sm mt-3.5 mb-1.5' : 'text-xs mt-3 mb-1'
                    }`}
                  >
                    {renderInlineMarkdown(text)}
                  </h3>
                );
              }

              // 2. Bold header line, e.g. "**Input Format:**" or "**Input Format**:"
              const boldHeaderMatch = line.match(/^\*\*([^*]+)\*\*:?\s*$/);
              if (boldHeaderMatch) {
                const title = boldHeaderMatch[1].replace(/:$/, '').trim();
                return (
                  <h4
                    key={lineIdx}
                    className="text-xs font-semibold text-lab-ink mt-3.5 mb-1 tracking-tight flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
                    <span>{title}</span>
                  </h4>
                );
              }

              // 3. Bold prefix on the same line, e.g. "**Input Format:** The first line..."
              const boldPrefixMatch = line.match(/^(\*\*[^*]+\*\*:?)\s+(.+)$/);
              if (boldPrefixMatch) {
                return (
                  <div key={lineIdx} className="text-[12.5px] leading-relaxed text-lab-prose">
                    {renderInlineMarkdown(boldPrefixMatch[1])}{' '}
                    <span>{renderInlineMarkdown(boldPrefixMatch[2])}</span>
                  </div>
                );
              }

              // 4. Unordered list item: "- item" or "* item"
              const bulletMatch = line.match(/^[-*]\s+(.+)$/);
              if (bulletMatch) {
                return (
                  <div
                    key={lineIdx}
                    className="flex items-start gap-2 pl-2 text-[12px] leading-relaxed text-lab-prose"
                  >
                    <span className="text-lab-faint select-none text-[10px] mt-1 shrink-0">•</span>
                    <div className="flex-1">
                      {renderInlineMarkdown(bulletMatch[1])}
                    </div>
                  </div>
                );
              }

              // 5. Ordered list item: "1. item"
              const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
              if (numberedMatch) {
                return (
                  <div
                    key={lineIdx}
                    className="flex items-start gap-2 pl-2 text-[12px] leading-relaxed text-lab-prose"
                  >
                    <span className="text-lab-muted font-mono select-none text-[11px] shrink-0">
                      {numberedMatch[1]}.
                    </span>
                    <div className="flex-1">
                      {renderInlineMarkdown(numberedMatch[2])}
                    </div>
                  </div>
                );
              }

              // 6. Regular text line / paragraph
              return (
                <p key={lineIdx} className="text-[12.5px] leading-relaxed text-lab-prose">
                  {renderInlineMarkdown(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Parses inline formatting: **bold** and `code`
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  // Regex to split by **bold** and `code` tokens
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-lab-ink">
          {boldText}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={index}
          className="mx-0.5 rounded-md border border-lab-line/10 bg-lab-line/[0.06] px-1.5 py-0.5 font-mono text-[11.5px] text-lab-ink"
        >
          {codeText}
        </code>
      );
    }

    return part;
  });
}
