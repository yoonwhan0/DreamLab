import { useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { ConversionGate } from "@/components/ConversionGate";
import { HomeTodayHero } from "@/components/HomeTodayHero";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/ui/PageHero";
import { BRAND_TAGLINE, CTA_WRITE_DREAM } from "@/lib/branding";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { HOME_FEATURED_KEYWORDS, getKeywordIcon } from "@/lib/keywordIcons";
import { previewCommunityForKeyword } from "@/services/syntheticCommunityService";
import { previewKeywordLabel } from "@/lib/previewKeywords";

const homePreviews = HOME_FEATURED_KEYWORDS.map((keyword) => ({
  keyword,
  label: previewKeywordLabel(keyword),
  data: previewCommunityForKeyword(keyword),
}));

export function HomePage() {
  const access = useAccessPolicy();
  const [activeIdx, setActiveIdx] = useState(0);
  const active = homePreviews[activeIdx] ?? homePreviews[0]!;

  return (
    <div className="home-page space-y-5 pb-4">
      <Reveal delay={0}>
        <PageHero title={BRAND_TAGLINE} centered />
      </Reveal>

      <Reveal delay={40}>
        <AppLink to="/write" className="btn-primary !min-h-[3rem] text-base">
          {CTA_WRITE_DREAM}
        </AppLink>
      </Reveal>

      <Reveal delay={80}>
        <HomeTodayHero />
      </Reveal>

      <Reveal delay={120}>
        <div className="space-y-2.5">
          <p className="text-xs text-text-muted px-1">많이 찾는 꿈</p>
          <div className="flex flex-wrap gap-2">
            {homePreviews.map((p, i) => (
              <button
                key={p.keyword}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`chip ${i === activeIdx ? "chip-primary" : ""}`}
              >
                <span className="mr-1" aria-hidden>
                  {getKeywordIcon(p.keyword)}
                </span>
                {p.keyword}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {active.data.stories[0] && (
        <Reveal delay={160}>
          <CommunityStoriesPanel
            stories={[active.data.stories[0]!]}
            title={`${active.label} — 30일 후`}
            variant="minimal"
            blurLocked={!access.isPremium}
            lockedCount={Math.max(active.data.stories.length - 1, 48)}
            keyword={active.keyword}
          />
        </Reveal>
      )}

      {!access.isMember && (
        <Reveal delay={200}>
          <ConversionGate step={2} keyword={active.keyword} compact />
        </Reveal>
      )}

      <Reveal delay={220}>
        <AppLink
          to="/explore"
          className="block text-center text-sm text-text-muted hover:text-primary transition-colors py-2"
        >
          같은 꿈 · 30일 후 후기 더 보기 →
        </AppLink>
      </Reveal>
    </div>
  );
}
