import type { Handler } from "@netlify/functions";

import {

  INTERPRET_GENERATION,

  INTERPRET_MODEL,

  SYSTEM_PROMPT,

  buildUserMessage,

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

}



const handler: Handler = async (event) => {

  if (event.httpMethod !== "POST") {

    return { statusCode: 405, body: "Method Not Allowed" };

  }



  const { title, content } = JSON.parse(event.body ?? "{}") as InterpretRequest;

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

              { role: "system", content: SYSTEM_PROMPT },

              { role: "user", content: buildUserMessage(title, content) },

            ],

            response_format: { type: "json_object" },

            temperature: INTERPRET_GENERATION.temperature,

            max_tokens: INTERPRET_GENERATION.max_tokens,

            presence_penalty: INTERPRET_GENERATION.presence_penalty,

            frequency_penalty: INTERPRET_GENERATION.frequency_penalty,

          }),

        });

      const interpretData = await interpretRes.json();

      const text = interpretData.choices?.[0]?.message?.content;

      if (text) {

        parsed = enrichInterpretation(

          normalizeParsed(JSON.parse(text), title, content),

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

                    text: `${SYSTEM_PROMPT}\n\n${buildUserMessage(title, content)}`,

                  },

                ],

              },

            ],

            generationConfig: {

              responseMimeType: "application/json",

              temperature: INTERPRET_GENERATION.temperature,

              maxOutputTokens: INTERPRET_GENERATION.max_tokens,

            },

          }),

        },

      );

      const data = await response.json();

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {

        parsed = enrichInterpretation(

          normalizeParsed(JSON.parse(text), title, content),

          title,

          content,

        );

        aiProvider = "gemini";

      }

    } catch (err) {

      console.error("Gemini error:", err);

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
): ParsedInterpretation["communityEstimate"]["stories"] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;

  const anchor = extractHeuristicKeywords(`${title} ${content}`, 1)[0] ?? "꿈";

  const profiles = [...VIVID_STORY_PROFILES];

  const outcomes = [

    "nothing",

    "good",

    "bad",

    "love",

    "job",

    "health",

  ] as const;



  const stories = raw.slice(0, 12).map((item, i) => {

    const s = item as Record<string, unknown>;

    const dreamTitleRaw = String(s.dreamTitle ?? s.title ?? `${anchor} 관련 꿈`);
    const dreamSnippetRaw = String(s.dreamSnippet ?? s.snippet ?? "");
    const dreamSnippet = repairStorySnippet(dreamSnippetRaw, i);
    const dreamTitle = isTemplateStorySnippet(dreamTitleRaw)
      ? excerptToStoryTitle(dreamSnippet)
      : dreamTitleRaw;

    const afterStory = ensureMultiline(String(s.afterStory ?? ""), 4);



    return {

      id: String(s.id ?? `ai-${i}`),

      dreamTitle,

      dreamSnippet,

      emotions: (Array.isArray(s.emotions) ? s.emotions : ["weird"]) as string[],

      outcomeCategory: String(

        s.outcomeCategory ?? outcomes[i % outcomes.length],

      ),

      afterStory:

        afterStory ||

        pickVividAfter(outcomes[i % outcomes.length]!, i),

      recordedDaysAgo: Number(s.recordedDaysAgo) || 7 + i * 3,

      profile: String(s.profile ?? profiles[i % profiles.length]!),

    };

  });



  const valid = stories
    .map((s, i) => sanitizeAiCommunityStory(s, i, content, title))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return valid.length >= 1 ? valid : fallback;
}



function buildFallbackStories(count = 10) {
  const outcomes = [
    "nothing",
    "good",
    "bad",
    "love",
    "job",
    "health",
    "family",
    "money",
    "other",
    "nothing",
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
      profile: VIVID_STORY_PROFILES[i % VIVID_STORY_PROFILES.length]!,
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
      `인터넷 해몽에서 "${kw}" 꿈은 **대박·행운·큰 변화** 쪽으로 읽히는 경우가 많아요.`,
      `"${kw}" 나오면 '곧 좋은 소식' 또는 반대로 '손재·주의'라고 단정하는 글도 잔뜩 있습니다.`,
      `해몽 카페마다 말은 다르지만, 공통점은 **'그냥 넘기면 아깝다'**는 분위기예요.`,
      `검색만 해도 "${kw} 꿈 대박", "${kw} 꿈 손재" 같은 제목이 줄줄 나옵니다.`,
    ].join("\n"),

    alternativeLens: [
      `근데 같은 "${kw}" 꿈을 꾼 사람들 **30일 뒤 후기**를 읽다 보면 이야기가 갈립니다.`,
      `어떤 사람은 별일 없었다고, 어떤 사람은 연애·돈·싸움이 터졌다고 적어요.`,
      `해몽만 믿고 끝내기엔, **한 달 뒤 결말**이 더 재밌습니다.`,
      `비슷한 꿈 후기를 더 보면 '어? 나랑 거의 같은데?' 하는 글이 꽤 있어요.`,
    ].join("\n"),

    symbol: `"${kw}" 해몽은 입구일 뿐이에요.\n같은 꿈 꾼 사람들 **30일 뒤**가 본편입니다.\n지금은 미리보기만 본 상태예요.`,

    psychology:

      "지금 불안하거나 궁금한 게 정상이에요.\n비슷한 꿈 검색한 사람들 후기를 읽다 보면\n'나만 이런 거 아니구나' 하면서 더 궁금해지는 경우가 많습니다.",

    reflection:

      "30일 뒤, 당신에게는 어떤 일이?\n같은 꿈 꾼 사람들 답변을 겹쳐 보면\n갈림길이 보이기 시작합니다.",

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

        nothing: Math.round(withFollowUpCount * 0.4),

        good: Math.round(withFollowUpCount * 0.14),

        bad: Math.round(withFollowUpCount * 0.2),

        love: Math.round(withFollowUpCount * 0.1),

        job: Math.round(withFollowUpCount * 0.08),

        health: Math.round(withFollowUpCount * 0.06),

        family: Math.round(withFollowUpCount * 0.05),

        money: Math.round(withFollowUpCount * 0.03),

        other: Math.round(withFollowUpCount * 0.02),

      },

    },

  };

}



export { handler };


