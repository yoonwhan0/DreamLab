import type { ElementType } from "react";
import { formatReadableParagraphs, splitReadableParagraphs } from "@/lib/formatText";

interface FormattedTextProps {
  children: string;
  className?: string;
  as?: ElementType;
  /** false면 원문 그대로 (이미 줄바꿈된 텍스트) */
  autoFormat?: boolean;
  maxLines?: number;
}

/** `\n` 줄바꿈 + 긴 문단 자동 분리 (한글 단어 중간 끊김 방지) */
export function FormattedText({
  children,
  className = "",
  as: Tag = "p",
  autoFormat = true,
  maxLines = 6,
}: FormattedTextProps) {
  const text = autoFormat ? formatReadableParagraphs(children, maxLines) : children;

  return (
    <Tag className={`copy-lines whitespace-pre-line ${className}`.trim()}>{text}</Tag>
  );
}

/** 문단마다 간격을 두고 표시 */
export function FormattedBlocks({
  children,
  className = "",
  autoFormat = true,
  maxLines = 8,
}: {
  children: string;
  className?: string;
  autoFormat?: boolean;
  maxLines?: number;
}) {
  const paragraphs = autoFormat
    ? splitReadableParagraphs(children, maxLines)
    : children.split("\n").filter(Boolean);

  if (paragraphs.length <= 1) {
    return (
      <FormattedText className={className} autoFormat={autoFormat} maxLines={maxLines}>
        {children}
      </FormattedText>
    );
  }

  return (
    <div className={`space-y-2.5 ${className}`.trim()}>
      {paragraphs.map((para, i) => (
        <p key={i} className="copy-lines whitespace-pre-line leading-relaxed">
          {para}
        </p>
      ))}
    </div>
  );
}
