import type { CommunityStory } from "@/types";
import { excerptToStoryTitle } from "@/lib/dreamAnchor";
import {
  alignStoryToKeyword,
  buildCoherentStoryForKeyword,
  isGenericVividPoolSnippet,
  storyRelatesToAnchor,
} from "@/lib/coherentCommunityStory";

/** 옛 템플릿·AI 티 — 이 패턴이면 키워드 맞춤 풀에서 교체 */
export const TEMPLATE_STORY_SNIPPET_RE =
  /갑자기 나타났|들어온 꿈|나를 쫓지는 않았지만|계속 시선이|선명하게 보였던 꿈이었어요|꿈 속에서 .+ 나왔어요|관련된 장면이었어요|떠오르는 꿈을 여러 번|비슷한 분위기로 기록|현실과 섞인 듯한 분위기|평소와 다른 공간에서 같은 감정|많은 시선이 느껴지는 장면|긴장보다 몰입에 가까웠|말하지 못한 채 남긴 꿈|한 번 더 떠올린 장면|비슷한 장면을 꾼|결이 비슷했습니다|직접 같진 않지만/;

function normalizeOverlapText(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

/** 다른 관측자 기록이 사용자 꿈 원문·제목과 겹치면 신뢰가 깨짐 */
export function overlapsUserDream(
  userText: string,
  candidate: string,
  minChars = 8,
): boolean {
  const userNorm = normalizeOverlapText(userText);
  const candNorm = normalizeOverlapText(candidate);
  if (!userNorm || !candNorm || userNorm.length < minChars) return false;
  if (candNorm.length >= minChars && userNorm.includes(candNorm)) return true;

  const maxWindow = Math.min(36, candNorm.length);
  for (let len = maxWindow; len >= minChars; len--) {
    for (let i = 0; i <= candNorm.length - len; i++) {
      const slice = candNorm.slice(i, i + len);
      if (userNorm.includes(slice)) return true;
    }
  }
  return false;
}

export function overlapsUserDreamFields(
  userContent: string,
  userTitle: string,
  fields: { title?: string; snippet?: string; afterStory?: string },
): boolean {
  const corpus = `${userTitle}\n${userContent}`.trim();
  if (!corpus) return false;
  return (
    (fields.title ? overlapsUserDream(corpus, fields.title) : false) ||
    (fields.snippet ? overlapsUserDream(corpus, fields.snippet) : false) ||
    (fields.afterStory ? overlapsUserDream(corpus, fields.afterStory, 10) : false)
  );
}

export function pickNeutralSceneLine(index: number, anchorKeyword = "시험"): string {
  return buildCoherentStoryForKeyword(anchorKeyword, index).dreamSnippet;
}

export function repairStorySnippet(
  snippet: string,
  index: number,
  anchorKeyword = "",
): string {
  const anchor = anchorKeyword.trim();
  const usable =
    snippet.length >= 24 &&
    !isTemplateStorySnippet(snippet) &&
    !isGenericVividPoolSnippet(snippet) &&
    (!anchor || storyRelatesToAnchor(snippet, anchor));

  if (usable) return snippet;
  return buildCoherentStoryForKeyword(anchor || "시험", index).dreamSnippet;
}

/** AI 후기 — 템플릿·사용자 원문 겹침 제거, 키워드 맥락 유지 */
export function sanitizeAiCommunityStory(
  story: CommunityStory,
  index: number,
  userContent = "",
  userTitle = "",
  anchorKeyword = "",
): CommunityStory | null {
  const anchor = anchorKeyword.trim() || userTitle.trim() || story.dreamTitle.trim();

  if (
    overlapsUserDreamFields(userContent, userTitle, {
      title: story.dreamTitle,
      snippet: story.dreamSnippet,
      afterStory: story.afterStory,
    })
  ) {
    return null;
  }

  const dreamSnippet = repairStorySnippet(story.dreamSnippet, index, anchor);
  const dreamTitle = isTemplateStorySnippet(story.dreamTitle)
    ? excerptToStoryTitle(dreamSnippet)
    : story.dreamTitle;

  const repaired = alignStoryToKeyword(
    { ...story, dreamTitle, dreamSnippet },
    anchor || "꿈",
    index,
  );

  if (
    overlapsUserDreamFields(userContent, userTitle, {
      title: repaired.dreamTitle,
      snippet: repaired.dreamSnippet,
      afterStory: repaired.afterStory,
    })
  ) {
    return null;
  }
  return isQualityCommunityStory(repaired) ? repaired : null;
}

export function isTemplateStorySnippet(text: string): boolean {
  return TEMPLATE_STORY_SNIPPET_RE.test(text);
}

export function isQualityCommunityStory(story: CommunityStory): boolean {
  return (
    story.dreamSnippet.length >= 20 &&
    !isTemplateStorySnippet(story.dreamSnippet) &&
    !isTemplateStorySnippet(story.dreamTitle) &&
    !isGenericVividPoolSnippet(story.dreamSnippet) &&
    !story.dreamTitle.includes("제목") &&
    !story.dreamSnippet.includes("제목")
  );
}

export function mergeCommunityStories(
  aiStories: CommunityStory[],
  syntheticStories: CommunityStory[],
  minCount = 10,
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

  if (merged.length > 0) return merged;
  return syntheticStories.slice(0, minCount);
}

/** AI 후기가 맥락 없이 깨졌을 때 키워드 맞춤 후기로 대체 */
export function fallbackCoherentStory(anchorKeyword: string, index = 0): CommunityStory {
  return buildCoherentStoryForKeyword(anchorKeyword, index);
}
