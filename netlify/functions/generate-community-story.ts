import type { Handler } from "@netlify/functions";
import {
  INTERPRET_GENERATION,
  INTERPRET_MODEL,
  ensureMultiline,
} from "./lib/interpretPremium";
import { extractHeuristicKeywords, excerptToStoryTitle } from "./lib/dreamAnchor";
import {
  isTemplateStorySnippet,
  repairStorySnippet,
  sanitizeAiCommunityStory,
} from "./lib/communityStoryQuality";
import { pickVividAfter } from "../../src/lib/vividPreviewCopy";
import {
  SINGLE_COMMUNITY_STORY_SYSTEM,
  buildSingleStoryUserMessage,
} from "../../src/lib/communityReviewPrompt";
import { recordAiUsage } from "./lib/recordAiUsage";

interface Body {
  title?: string;
  content?: string;
  storyIndex?: number;
  avoidTitles?: string[];
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { title = "", content = "", storyIndex = 0, avoidTitles = [] } = JSON.parse(
    event.body ?? "{}",
  ) as Body;

  if (!content || content.length < 5) {
    return { statusCode: 400, body: JSON.stringify({ error: "content required" }) };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const anchor =
    (extractHeuristicKeywords(`${title} ${content}`, 1)[0] ?? title.trim()) || "꿈";

  let story: Record<string, unknown> | null = null;
  let aiProvider: "openai" | "gemini" | "fallback" = "fallback";

  const userMessage = buildSingleStoryUserMessage(title, content, storyIndex, avoidTitles);

  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: INTERPRET_MODEL,
          messages: [
            { role: "system", content: SINGLE_COMMUNITY_STORY_SYSTEM },
            { role: "user", content: userMessage },
          ],
          response_format: { type: "json_object" },
          temperature: INTERPRET_GENERATION.temperature,
          max_tokens: 900,
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        const parsed = JSON.parse(text) as { story?: Record<string, unknown> };
        story = parsed.story ?? (parsed as Record<string, unknown>);
        aiProvider = "openai";
      }
    } catch (err) {
      console.error("generate-community-story OpenAI error:", err);
    }
  } else if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${SINGLE_COMMUNITY_STORY_SYSTEM}\n\n${userMessage}` }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: INTERPRET_GENERATION.temperature,
              maxOutputTokens: 900,
            },
          }),
        },
      );
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text) as { story?: Record<string, unknown> };
        story = parsed.story ?? (parsed as Record<string, unknown>);
        aiProvider = "gemini";
      }
    } catch (err) {
      console.error("generate-community-story Gemini error:", err);
    }
  }

  try {
    await recordAiUsage({ provider: aiProvider, success: Boolean(story) });
  } catch (err) {
    console.error("AI usage log failed:", err);
  }

  const outcomes = ["good", "bad", "love", "job", "health", "other"] as const;
  const outcome = outcomes[storyIndex % outcomes.length]!;

  const dreamSnippetRaw = String(story?.dreamSnippet ?? story?.snippet ?? "");
  const dreamSnippet = repairStorySnippet(dreamSnippetRaw, storyIndex, anchor);
  const dreamTitleRaw = String(story?.dreamTitle ?? story?.title ?? `${anchor} 관련 꿈`);
  const dreamTitle = isTemplateStorySnippet(dreamTitleRaw)
    ? excerptToStoryTitle(dreamSnippet)
    : dreamTitleRaw;
  const afterStory =
    ensureMultiline(String(story?.afterStory ?? ""), 4) ||
    pickVividAfter(outcome, storyIndex);

  const rawStory = {
    id: `ai-slot-${storyIndex}`,
    dreamTitle,
    dreamSnippet,
    emotions: (Array.isArray(story?.emotions) ? story.emotions : ["weird"]) as string[],
    outcomeCategory: String(story?.outcomeCategory ?? outcome),
    afterStory,
    recordedDaysAgo: Number(story?.recordedDaysAgo) || 7 + storyIndex * 4,
    profile: "익명 기록",
  };

  const sanitized = sanitizeAiCommunityStory(rawStory, storyIndex, content, title, anchor);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      story: sanitized ?? rawStory,
      isEstimated: true,
    }),
  };
};

export { handler };
