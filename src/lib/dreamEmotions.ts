import type { DreamEmotionId, DreamInterpretation } from "@/types";

/** AI mood → 꿈 감정 태그 (Write 단계 선택 없이 자동) */
export function inferEmotionsFromInterpretation(
  interpretation: DreamInterpretation,
): DreamEmotionId[] {
  const mood = interpretation.mood;
  if (!mood) return ["weird"];

  const ranked: [DreamEmotionId, number][] = [
    ["scared", mood.anxiety],
    ["happy", mood.hope],
    ["sad", mood.longing],
    ["calm", Math.round((mood.hope + (100 - mood.anxiety)) / 2)],
    ["weird", Math.round((mood.anxiety + mood.longing) / 4)],
  ];
  ranked.sort((a, b) => b[1] - a[1]);

  const primary = ranked[0]![0];
  const secondary = ranked.find(
    ([id, value], index) => index > 0 && value >= 22 && id !== primary,
  )?.[0];

  return secondary ? [primary, secondary] : [primary];
}
