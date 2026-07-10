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

        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,

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

  const clusterTitle = researchAnchor?.clusterLabel?.trim();
  const anchor = extractHeuristicKeywords(`${title} ${content}`, 1)[0] ?? "꿈";

  const profiles = ["20대 · 여", "30대 · 남", "20대 · 남", "40대 · 여", "30대 · 여"];

  const outcomes = [

    "nothing",

    "good",

    "bad",

    "love",

    "job",

    "health",

  ] as const;



  const stories = raw.slice(0, 6).map((item, i) => {

    const s = item as Record<string, unknown>;

    const dreamTitleRaw = String(s.dreamTitle ?? s.title ?? `${anchor} 관련 꿈`);
    const dreamSnippetRaw = String(s.dreamSnippet ?? s.snippet ?? "");
    const dreamSnippet = repairStorySnippet(dreamSnippetRaw, i);
    const dreamTitle =
      i === 0 && clusterTitle
        ? clusterTitle
        : isTemplateStorySnippet(dreamTitleRaw)
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

        "30일이 지나 특별한 변화는 없었어요.\n다만 꿈의 장면은 자주 떠올랐어요.",

      recordedDaysAgo: Number(s.recordedDaysAgo) || 7 + i * 3,

      profile: String(s.profile ?? profiles[i % profiles.length]!),

    };

  });



  const valid = stories
    .map((s, i) => sanitizeAiCommunityStory(s, i, clusterTitle))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return valid.length >= 1 ? valid : fallback;
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

  const storySnippet = pickNeutralSceneLine(0);
  const storyTitle = excerptToStoryTitle(storySnippet);
  const secondSnippet = pickNeutralSceneLine(1);
  const secondTitle = excerptToStoryTitle(secondSnippet);



  return {

    usualTake: [
      `전통·인터넷 해몽에서 "${kw}"은(는) 변화나 메시지의 상징으로 자주 언급됩니다.`,
      `"${kw}"이(가) 나오는 꿈은 '곧 일이 생긴다'거나 '감정이 드러난다'고 설명되기도 합니다.`,
      `일부 해석은 불안한 장면이 섞이면 나쁜 징조·관계 문제로 단정하기도 합니다.`,
      `해몽 사이트마다 조금씩 다르지만, 대체로 '${kw}'에 꽤 큰 의미를 부여합니다.`,
    ].join("\n"),

    alternativeLens: [
      `보통은 불길한 징조로 읽히지만, "${kw}" 장면은 지금 마음의 압력과 겹쳐 보일 때가 많습니다.`,
      `꿈의 분위기·감정이 상징보다 먼저일 수 있어요.`,
      `비슷한 키워드를 남긴 기록들을 보면, 한 달 뒤 답은 별일 없음·갈등·좋은 일로 갈립니다.`,
    ].join("\n"),

    symbol: `"${kw}"은(는) 미래를 확정하지 않아요.\n해몽은 입구일 뿐이고,\n한 달 뒤 기록과 겹쳐 봐야 합니다.`,

    psychology:

      "지금 불안하거나 무섭게 느껴질 수 있어요.\n비슷한 키워드를 남긴 기록들을 보면\n별일 없음·갈등·좋은 일이 섞여 나옵니다.",

    reflection:

      "30일 뒤 한 줄 답이 쌓이면\n이 꿈의 갈릴 지점이 보입니다.\n당신은 어느 쪽에 가까울까요?",

    keywords: keywords.length > 0 ? keywords : ["꿈", "마음", "변화"],

    category,

    mood: { anxiety: 40, hope: 35, longing: 25 },

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

      samples: [

        {

          title: storyTitle,

          snippet: storySnippet,

          emotions: ["scared"],

        },

        {

          title: secondTitle,

          snippet: secondSnippet,

          emotions: ["weird", "scared"],

        },

      ],

      stories: [

        {

          id: "fb-1",

          dreamTitle: storyTitle,

          dreamSnippet: storySnippet,

          emotions: ["scared", "weird"],

          outcomeCategory: "nothing",

          afterStory:

            "30일이 지나도 큰 변화는 없었어요.\n다만 꿈 이후로\n그 상황에 덜 민감해진 것 같습니다.",

          recordedDaysAgo: 14,

          profile: "20대 · 여",

        },

        {

          id: "fb-2",

          dreamTitle: secondTitle,

          dreamSnippet: secondSnippet,

          emotions: ["scared"],

          outcomeCategory: "bad",

          afterStory:

            "한 달 안에 직장·관계에서 갈등이 터졌어요.\n꿈의 불길함과 겹쳐 더 무서웠습니다.\n그래도 지나고 보니, 그때도 결국 버텨냈다는 위로가 됐어요.",

          recordedDaysAgo: 21,

          profile: "30대 · 남",

        },

      ],

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


