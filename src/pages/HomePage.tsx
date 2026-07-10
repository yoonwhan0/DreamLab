import { useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { HomeFeaturedStoryPanel } from "@/components/HomeFeaturedStoryPanel";
import { HomeObservatorySignal } from "@/components/HomeObservatorySignal";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/ui/PageHero";
import { CTA_WRITE_DREAM } from "@/lib/branding";
import { PAGE_COPY } from "@/lib/productIdeas";
import { HOME_FEATURED_KEYWORDS, getKeywordIcon } from "@/lib/keywordIcons";
import { previewCommunityForKeyword } from "@/services/syntheticCommunityService";
import { previewKeywordLabel } from "@/lib/previewKeywords";

const homePreviews = HOME_FEATURED_KEYWORDS.map((keyword) => ({
  keyword,
  label: previewKeywordLabel(keyword),
  data: previewCommunityForKeyword(keyword),
}));

export function HomePage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = homePreviews[activeIdx] ?? homePreviews[0]!;
  const hero = PAGE_COPY.home;

  return (
    <div className="home-page space-y-5 pb-4">
      <Reveal delay={0}>
        <PageHero
          label={hero.label}
          title={hero.title}
          descLead={hero.descLead}
          descMid={hero.descMid}
          descAccent={hero.descAccent}
          centered
        />
      </Reveal>

      <Reveal delay={50}>
        <HomeObservatorySignal />
      </Reveal>

      <Reveal delay={80}>
        <AppLink to="/write" className="btn-primary !min-h-[3rem] text-base">
          {CTA_WRITE_DREAM}
        </AppLink>
      </Reveal>

      <Reveal delay={110}>
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
        <Reveal delay={120}>
          <HomeFeaturedStoryPanel
            keyword={active.keyword}
            label={active.label}
            estimate={active.data}
          />
        </Reveal>
      )}

      <Reveal delay={160}>
        <AppLink
          to="/explore"
          className="block text-center text-sm text-text-muted hover:text-primary transition-colors py-2"
        >
          당신만 모르는 결말, 더 보기 →
        </AppLink>
      </Reveal>
    </div>
  );
}
