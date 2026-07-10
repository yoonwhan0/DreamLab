import type { CommunityStory } from "@/types";
import { excerptToStoryTitle } from "@/lib/dreamAnchor";

export const TEMPLATE_STORY_SNIPPET_RE =
  /갑자기 나타났|들어온 꿈|나를 쫓지는 않았지만|계속 시선이|선명하게 보였던 꿈이었어요|꿈 속에서 .+ 나왔어요|관련된 장면이었어요\. 분위기가 오래|이\(가\) 선명하게 남은 꿈|새벽에 깨어난 .+ 관련 꿈|떠오르는 꿈을 여러 번|비슷한 분위기로 기록/;

const NEUTRAL_SCENE_LINES = [
  "시험 전날 밤, 문제지가 사라지는 꿈이었어요. 깨고 나서도 가슴이 조금 답답했습니다.",
  "낯선 복도를 헤매다 늦었다는 알림만 들리는 꿈이었어요. 현실과 섞여서 더 선명했습니다.",
  "비슷한 주제로 꾼 꿈이었어요. 장면은 달랐지만 불안한 분위기는 비슷했습니다.",
  "새벽에 깨었을 때도 장면이 남아 있어서 바로 메모해 두었어요.",
] as const;

export function pickNeutralSceneLine(index: number): string {
  return NEUTRAL_SCENE_LINES[index % NEUTRAL_SCENE_LINES.length]!;
}

export function repairStorySnippet(snippet: string, index: number): string {
  if (snippet.length >= 10 && !isTemplateStorySnippet(snippet)) {
    return snippet;
  }
  return pickNeutralSceneLine(index);
}

/** AI 후기 — 템플릿만 중립 문장으로 교체 (사용자 꿈 본문 끼우기 금지) */
export function sanitizeAiCommunityStory(
  story: CommunityStory,
  index: number,
  clusterTitle?: string,
): CommunityStory | null {
  const dreamSnippet = repairStorySnippet(story.dreamSnippet, index);
  const dreamTitle =
    index === 0 && clusterTitle
      ? clusterTitle
      : isTemplateStorySnippet(story.dreamTitle)
        ? excerptToStoryTitle(dreamSnippet)
        : story.dreamTitle;

  const repaired = { ...story, dreamTitle, dreamSnippet };
  return isQualityCommunityStory(repaired) ? repaired : null;
}

export function isTemplateStorySnippet(text: string): boolean {
  return TEMPLATE_STORY_SNIPPET_RE.test(text);
}

export function isQualityCommunityStory(story: CommunityStory): boolean {
  return (
    story.dreamSnippet.length >= 10 &&
    !isTemplateStorySnippet(story.dreamSnippet) &&
    !isTemplateStorySnippet(story.dreamTitle) &&
    !story.dreamTitle.includes("제목") &&
    !story.dreamSnippet.includes("제목")
  );
}

export function mergeCommunityStories(
  aiStories: CommunityStory[],
  syntheticStories: CommunityStory[],
  minCount = 6,
): CommunityStory[] {
  const merged: CommunityStory[] = [];
  const seen = new Set<string>();

  const add = (story: CommunityStory) => {
    const key = `${story.dreamTitle}|${story.dreamSnippet}`;
    if (seen.has(key) || !isQualityCommunityStory(story)) return;
    seen.add(key);
    merged.push(story);
  };

  for (const story of aiStories) add(story);
  for (const story of syntheticStories) {
    if (merged.length >= minCount) break;
    add(story);
  }

  return merged.length > 0 ? merged : syntheticStories.slice(0, minCount);
}
