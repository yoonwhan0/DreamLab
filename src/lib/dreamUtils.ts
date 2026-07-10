export {
  extractTitleFromContent,
  parseDreamInput,
  resolveAnchorFromText,
  resolveResearchAnchor,
  extractMeaningfulKeywords,
  mergeAiKeywords,
} from "@/lib/dreamAnchor";

export { inferEmotionsFromInterpretation } from "@/lib/dreamEmotions";

export function getDaysRemaining(dueDate: Date): number {
  const diff = dueDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function formatDaysBadge(dueDate: Date, answered: boolean): string {
  if (answered) return "답변 완료";
  const days = getDaysRemaining(dueDate);
  if (days <= 0) return "답변 가능";
  return `D-${days}`;
}

export function getJourneyProgress(createdAt: Date, dueDate: Date): number {
  const total = dueDate.getTime() - createdAt.getTime();
  if (total <= 0) return 100;
  const elapsed = Date.now() - createdAt.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}
