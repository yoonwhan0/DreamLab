import type { Handler } from "@netlify/functions";

import {

  INTERPRET_GENERATION,

  INTERPRET_MODEL,

  EMBED_MODEL,

  EMBED_DIMENSIONS,

  EXPLORE_SYSTEM_PROMPT,

  SYSTEM_PROMPT,

  buildUserMessage,

  buildEmbeddingText,

  enrichInterpretation,

  ensureMultiline,

  type ParsedInterpretation,

} from "./lib/interpretPremium";

import { extractHeuristicKeywords, mergeAiKeywords, excerptToStoryTitle } from "./lib/dreamAnchor";
import {
  isTemplateStorySnippet,
  repairStorySnippet,
  sanitizeAiCommunityStory,
  pickNeutralSceneLine,
} from "./lib/communityStoryQuality";
import {
  VIVID_DREAM_TITLES,
  VIVID_STORY_PROFILES,
  pickVividAfter,
} from "../../src/lib/vividPreviewCopy";
import { recordAiUsage } from "./lib/recordAiUsage";



interface InterpretRequest {

  title: string;

  content: string;

  exploreMode?: boolean;

}



const handler: Handler = async (event) => {

  if (event.httpMethod !== "POST") {

    return { statusCode: 405, body: "Method Not Allowed" };

  }



  const { title, content, exploreMode = false } = JSON.parse(event.body ?? "{}") as InterpretRequest;

  const fullText = `${title}\n${content}`;

  if (!content || content.length < 5) {

    return { statusCode: 400, body: JSON.stringify({ error: "content required" }) };

  }

  if (content.length > 4000) {

    return { statusCode: 413, body: JSON.stringify({ error: "content too long" }) };

  }



  const openaiKey = process.env.OPENAI_API_KEY;

  const geminiKey = process.env.GEMINI_API_KEY;



  let parsed = enrichInterpretation(fallbackInterpret(title, content), title, content);

  let embedding: number[] = [];

  let aiProvider: "openai" | "gemini" | "fallback" = "fallback";



  const systemPrompt = exploreMode ? EXPLORE_SYSTEM_PROMPT : SYSTEM_PROMPT;
  const userMessage = buildUserMessage(title, content, exploreMode);

  if (openaiKey) {

    try {

      const interpretRes = await fetch("https://api.openai.com/v1/chat/completions", {

          method: "POST",

          headers: {

            Authorization: `Bearer ${openaiKey}`,

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            model: INTERPRET_MODEL,

            messages: [

              { role: "system", content: systemPrompt },

              { role: "user", content: userMessage },

            ],

            response_format: { type: "json_object" },

            temperature: INTERPRET_GENERATION.temperature,

            max_tokens: exploreMode ? 2400 : INTERPRET_GENERATION.max_tokens,

            presence_penalty: INTERPRET_GENERATION.presence_penalty,

            frequency_penalty: INTERPRET_GENERATION.frequency_penalty,

          }),

        });

      const interpretData = await interpretRes.json();

      const text = interpretData.choices?.[0]?.message?.content;

      if (text) {

        parsed = enrichInterpretation(

          normalizeParsed(JSON.parse(text), title, content, exploreMode),

          title,

          content,

        );

        aiProvider = "openai";

      }

    } catch (err) {

      console.error("OpenAI error:", err);

    }

  } else if (geminiKey) {

    try {

      const response = await fetch(

        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,

        {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({

            contents: [

              {

                parts: [

                  {

                    text: `${systemPrompt}\n\n${userMessage}`,

                  },

                ],

              },

            ],

            generationConfig: {

              responseMimeType: "application/json",

              temperature: INTERPRET_GENERATION.temperature,

              maxOutputTokens: exploreMode ? 2400 : INTERPRET_GENERATION.max_tokens,

            },

          }),

        },

      );

      const data = await response.json();

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {

        parsed = enrichInterpretation(

          normalizeParsed(JSON.parse(text), title, content, exploreMode),

          title,

          content,

        );

        aiProvider = "gemini";

      }

    } catch (err) {

      console.error("Gemini error:", err);

    }

  }



  // 임베딩 생성 — 태그·요소 기반 정규 텍스트로 (탐색 모드는 비용 절감 위해 생략)
  if (openaiKey && !exploreMode) {
    try {
      const embedText = buildEmbeddingText(parsed, title, content);
      const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: EMBED_MODEL,
          input: embedText,
          dimensions: EMBED_DIMENSIONS,
        }),
      });
      const embedData = await embedRes.json();
      const vec = embedData?.data?.[0]?.embedding;
      if (Array.isArray(vec)) embedding = vec as number[];
    } catch (err) {
      console.error("Embedding error:", err);
    }
  }

  try {

    await recordAiUsage({ provider: aiProvider, success: true });

  } catch (err) {

    console.error("AI usage log failed:", err);

  }



  return {

    statusCode: 200,

    body: JSON.stringify({

      interpretation: {

        usualTake: parsed.usualTake,

        alternativeLens: parsed.alternativeLens,

        symbol: parsed.symbol,

        psychology: parsed.psychology,

        reflection: parsed.reflection,

        keywords: parsed.keywords,

        category: parsed.category,

        mood: parsed.mood,

        labObservations: parsed.labObservations,

        researchAnchor: parsed.researchAnchor,

        elements: parsed.elements,

        observation: parsed.observation,

        signals: parsed.signals,

      },

      embedding,

      communityEstimate: {

        ...parsed.communityEstimate,

        isEstimated: true,

      },

    }),

  };

};



function normalizeParsed(
  raw: Record<string, unknown>,
  title: string,
  content: string,
  exploreMode = false,
): ParsedInterpretation {

  const fullText = `${title}\n${content}`;
  const fallback = fallbackInterpret(title, content);
  const ce = (raw.communityEstimate ?? {}) as Record<string, unknown>;
  const aiKeywords = Array.isArray(raw.keywords)
    ? (raw.keywords as string[]).slice(0, 8)
    : fallback.keywords;
  const keywords = mergeAiKeywords(aiKeywords, title, content, 6);

  const ra = raw.researchAnchor as Record<string, unknown> | undefined;
  const researchAnchor =
    ra && typeof ra.primary === "string"
      ? {
          primary: String(ra.primary),
          secondary: Array.isArray(ra.secondary)
            ? (ra.secondary as string[]).slice(0, 5)
            : undefined,
          scenePhrases: Array.isArray(ra.scenePhrases)
            ? (ra.scenePhrases as string[]).slice(0, 3)
            : undefined,
          clusterLabel:
            typeof ra.clusterLabel === "string" ? String(ra.clusterLabel) : undefined,
        }
      : undefined;

  const stories = normalizeStories(
    ce.stories,
    title,
    content,
    fallback.communityEstimate.stories,
    researchAnchor,
    exploreMode,
  );

  const samples = Array.isArray(ce.samples) && (ce.samples as unknown[]).length >= 2
    ? (ce.samples as { title: string; snippet?: string; emotions: string[] }[])
    : stories.slice(0, 5).map((s) => ({
        title: s.dreamTitle,
        snippet: s.dreamSnippet,
        emotions: s.emotions,
      }));

  const lo = raw.labObservations as Record<string, unknown> | undefined;
  const labObservations =
    lo && typeof lo.sceneNote === "string"
      ? {
          sceneNote: String(lo.sceneNote),
          commonBehaviors: Array.isArray(lo.commonBehaviors)
            ? (lo.commonBehaviors as string[]).slice(0, 4)
            : [],
          relatedSearches: Array.isArray(lo.relatedSearches)
            ? (lo.relatedSearches as string[]).slice(0, 5)
            : [],
        }
      : undefined;

  return {

    usualTake: ensureMultiline(String(raw.usualTake ?? fallback.usualTake), 6),

    alternativeLens: ensureMultiline(

      String(raw.alternativeLens ?? fallback.alternativeLens),

      6,

    ),

    symbol: ensureMultiline(String(raw.symbol ?? fallback.symbol), 4),

    psychology: ensureMultiline(String(raw.psychology ?? fallback.psychology), 4),

    reflection: ensureMultiline(String(raw.reflection ?? fallback.reflection), 4),

    keywords: keywords.length > 0 ? keywords : fallback.keywords,

    category: String(raw.category ?? fallback.category),

    mood: (raw.mood as { anxiety: number; hope: number; longing: number }) ??

      fallback.mood,

    labObservations,

    researchAnchor,

    elements: raw.elements as ParsedInterpretation["elements"],

    observation: raw.observation as ParsedInterpretation["observation"],

    signals: raw.signals as ParsedInterpretation["signals"],

    communityEstimate: {

      totalCount: Number(ce.totalCount) || fallback.communityEstimate.totalCount,

      withFollowUpCount:

        Number(ce.withFollowUpCount) ||

        fallback.communityEstimate.withFollowUpCount,

      keywords: Array.isArray(ce.keywords)

        ? (ce.keywords as { keyword: string; count: number }[])

        : fallback.communityEstimate.keywords,

      emotionCounts: Array.isArray(ce.emotionCounts)

        ? (ce.emotionCounts as { emotion: string; count: number }[])

        : fallback.communityEstimate.emotionCounts,

      samples,

      stories,

      outcomes:

        (ce.outcomes as Record<string, number>) ??

        fallback.communityEstimate.outcomes,

    },

  };

}



function normalizeStories(
  raw: unknown,
  title: string,
  content: string,
  fallback: ParsedInterpretation["communityEstimate"]["stories"],
  researchAnchor?: ParsedInterpretation["researchAnchor"],
  exploreMode = false,
): ParsedInterpretation["communityEstimate"]["stories"] {
  const maxStories = exploreMode ? 1 : 12;
  if (!Array.isArray(raw) || raw.length === 0) {
    return exploreMode ? fallback.slice(0, 1) : fallback;
  }

  const anchor =
    researchAnchor?.primary?.trim() ||
    extractHeuristicKeywords(`${title} ${content}`, 1)[0] ||
    title.trim() ||
    "꿈";

  const outcomes = [
    "good",
    "bad",
    "love",
    "job",
    "health",
    "other",
  ] as const;



  const stories = raw.slice(0, maxStories).map((item, i) => {

    const s = item as Record<string, unknown>;

    const dreamTitleRaw = String(s.dreamTitle ?? s.title ?? `${anchor} 관련 꿈`);
    const dreamSnippetRaw = String(s.dreamSnippet ?? s.snippet ?? "");
    const dreamSnippet = repairStorySnippet(dreamSnippetRaw, i, anchor);
    const dreamTitle = isTemplateStorySnippet(dreamTitleRaw)
      ? excerptToStoryTitle(dreamSnippet)
      : dreamTitleRaw;

    const afterStory = ensureMultiline(String(s.afterStory ?? ""), 4);



    return {

      id: String(s.id ?? `ai-${i}`),

      dreamTitle,

      dreamSnippet,

      emotions: (Array.isArray(s.emotions) ? s.emotions : ["weird"]) as string[],

      outcomeCategory: normalizeStoryOutcome(
        String(s.outcomeCategory ?? outcomes[i % outcomes.length]),
      ),

      afterStory:

        afterStory ||

        pickVividAfter(outcomes[i % outcomes.length]!, i),

      recordedDaysAgo: Number(s.recordedDaysAgo) || 7 + i * 3,

      profile: "익명 기록",

    };

  });



  const valid = stories
    .map((s, i) => sanitizeAiCommunityStory(s, i, content, title, anchor))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return valid.length >= 1
    ? valid.slice(0, maxStories)
    : exploreMode
      ? fallback.slice(0, 1)
      : fallback;
}



function normalizeStoryOutcome(raw: string): string {
  if (raw === "nothing" || raw === "별일 없었음" || raw === "별일없었음") return "other";
  return raw;
}

function buildFallbackStories(count = 10) {
  const outcomes = [
    "good",
    "bad",
    "love",
    "job",
    "health",
    "family",
    "money",
    "other",
    "good",
    "bad",
  ] as const;

  return Array.from({ length: count }, (_, i) => {
    const snippet = pickNeutralSceneLine(i);
    const outcome = outcomes[i % outcomes.length]!;
    return {
      id: `fb-${i + 1}`,
      dreamTitle: VIVID_DREAM_TITLES[i % VIVID_DREAM_TITLES.length]!,
      dreamSnippet: snippet,
      emotions: i % 3 === 0 ? ["scared", "weird"] : ["scared"],
      outcomeCategory: outcome,
      afterStory: pickVividAfter(outcome, i),
      recordedDaysAgo: 5 + i * 4,
      profile: "익명 기록",
    };
  });
}

function fallbackInterpret(title: string, content: string): ParsedInterpretation {

  const fullText = `${title}\n${content}`;
  const keywords = extractHeuristicKeywords(fullText, 5);
  const kw = keywords[0] ?? extractHeuristicKeywords(title, 1)[0] ?? "꿈";

  let category = "general";

  if (/부모|어머니|아버지|할머|할아버|돌아가/.test(fullText)) category = "family";

  else if (/연애|남친|여친|결혼|이별/.test(fullText)) category = "love";

  else if (/직장|회사|시험|학교|취업|이직/.test(fullText)) category = "career";

  else if (/뱀|죽|피|추락|쫓/.test(fullText)) category = "anxiety";

  else if (/돈|재물|황금|복권/.test(fullText)) category = "fortune";

  const totalCount = 400 + (fullText.length % 900);

  const withFollowUpCount = Math.round(totalCount * 0.44);

  const fallbackStories = buildFallbackStories(10);
  const samples = fallbackStories.slice(0, 5).map((s) => ({
    title: s.dreamTitle,
    snippet: s.dreamSnippet,
    emotions: s.emotions,
  }));



  return {

    usualTake: [
      `일반 해몽에서 "${kw}" 꿈은 변화, 압박감, 관계의 신호처럼 읽히는 경우가 많아요.`,
      `"${kw}"이(가) 나왔다고 해서 곧바로 길흉을 단정하기보다는 꿈속 분위기와 감정을 함께 봅니다.`,
      `같은 키워드라도 무서웠는지, 편안했는지, 깬 뒤 어떤 느낌이 남았는지에 따라 풀이가 달라져요.`,
      `꿈연구소는 이 해몽을 출발점으로 두고 30일 뒤 실제 기록과 함께 비교합니다.`,
    ].join("\n"),

    alternativeLens: [
      `다만 "${kw}" 장면은 단순히 좋은 꿈·나쁜 꿈으로만 나누기 어렵습니다.`,
      `꿈속에서 몸이 먼저 긴장했는지, 누군가와의 거리가 달라졌는지, 반복되는 장소가 있었는지가 단서가 됩니다.`,
      `30일 뒤 후기는 꿈이 현실을 맞혔다는 증거가 아니라, 그 시기 마음과 사건을 다시 대조하는 기록에 가깝습니다.`,
      `그래서 지금은 장면을 정확히 남겨두는 것이 가장 중요합니다.`,
    ].join("\n"),

    symbol: `"${kw}" 해몽은 입구일 뿐이에요.\n이 장면이 어떤 감정과 연결됐는지 적어두면\n30일 뒤 실제 기록과 더 차분히 비교할 수 있습니다.`,

    psychology:

      "지금 불안하거나 궁금한 게 정상이에요.\n꿈은 말로 정리하지 못한 압박감이나 기대를\n낯선 장면으로 보여주는 경우가 많습니다.",

    reflection:

      "30일 뒤, 당신에게는 어떤 일이 있었나요?\n오늘의 감정과 그때의 현실을 겹쳐 보면\n이 꿈의 의미가 조금 더 구체적으로 보입니다.",

    keywords: keywords.length > 0 ? keywords : ["꿈", "마음", "변화"],

    category,

    mood: { anxiety: 48, hope: 32, longing: 28 },

    communityEstimate: {

      totalCount,

      withFollowUpCount,

      keywords: (keywords.length > 0 ? keywords : ["꿈", "마음"]).map(

        (keyword, i) => ({

          keyword,

          count: Math.round(totalCount * (0.5 - i * 0.1)),

        }),

      ),

      emotionCounts: [

        { emotion: "scared", count: Math.round(totalCount * 0.35) },

        { emotion: "weird", count: Math.round(totalCount * 0.22) },

        { emotion: "calm", count: Math.round(totalCount * 0.15) },

      ],

      samples,

      stories: fallbackStories,

      outcomes: {
        good: Math.round(withFollowUpCount * 0.22),
        bad: Math.round(withFollowUpCount * 0.28),
        love: Math.round(withFollowUpCount * 0.12),
        job: Math.round(withFollowUpCount * 0.1),
        health: Math.round(withFollowUpCount * 0.08),
        family: Math.round(withFollowUpCount * 0.07),
        money: Math.round(withFollowUpCount * 0.05),
        other: Math.round(withFollowUpCount * 0.08),
      },

    },

  };

}



export { handler };
