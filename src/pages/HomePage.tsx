import { useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { CommunityStatPreview } from "@/components/CommunityStatPreview";
import { ConversionGate } from "@/components/ConversionGate";
import { ConsumerJourneyStrip } from "@/components/ConsumerJourneyStrip";
import { Reveal } from "@/components/motion/Reveal";
import { ResearchLabPanel } from "@/components/ResearchLabPanel";
import { ResearchPulseToday } from "@/components/ResearchPulseToday";
import { ServiceIntroAccordion } from "@/components/ServiceIntroAccordion";
import { StickyHomeCta } from "@/components/StickyHomeCta";
import { PageHero } from "@/components/ui/PageHero";
import { PAGE_COPY } from "@/lib/productIdeas";
import {
  CTA_EXPLORE,
  CTA_WRITE_DREAM,
  HINT_GUEST,
  HINT_MEMBER,
  HINT_PREMIUM,
} from "@/lib/branding";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import {
  estimateToStats,
  previewCommunityForKeyword,
} from "@/services/syntheticCommunityService";
import {
  getRandomProvocativeKeywords,
  previewKeywordLabel,
} from "@/lib/previewKeywords";

function buildHomePreviews() {
  const keywords = getRandomProvocativeKeywords(4);
  return {
    previews: keywords.map((keyword) => ({
      keyword,
      label: previewKeywordLabel(keyword),
      data: previewCommunityForKeyword(keyword),
    })),
    activeIdx: Math.floor(Math.random() * keywords.length),
  };
}

export function HomePage() {
  const access = useAccessPolicy();
  const [{ previews, activeIdx: initialActive }] = useState(buildHomePreviews);
  const [activeIdx, setActiveIdx] = useState(initialActive);
  const active = previews[activeIdx] ?? previews[0]!;
  const stats = estimateToStats(active.data);

  const ctaLabel = CTA_WRITE_DREAM;

  return (
    <>
      <div className="home-page space-y-4">
        <Reveal delay={0}>
          <PageHero
            label={PAGE_COPY.home.label}
            title={PAGE_COPY.home.title}
            descLead={PAGE_COPY.home.descLead}
            descMid={PAGE_COPY.home.descMid}
            descAccent={PAGE_COPY.home.descAccent}
          />
        </Reveal>

        <Reveal delay={40}>
          <ResearchLabPanel />
        </Reveal>

        <Reveal delay={100}>
          <ResearchPulseToday />
        </Reveal>

        <Reveal delay={160}>
          <ConsumerJourneyStrip />
        </Reveal>

        <Reveal delay={220}>
          <p className="text-xs text-text-muted px-1">많이 찾는 꿈</p>
        </Reveal>

        <Reveal delay={240}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {previews.map((p, i) => (
                <button
                  key={p.keyword}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`chip ${i === activeIdx ? "chip-primary" : ""}`}
                >
                  #{p.keyword}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={280}>
          <CommunityStatPreview
            keyword={active.label}
            totalCount={active.data.totalCount}
            withFollowUpCount={active.data.withFollowUpCount}
            stats={stats}
            showCuriosityTease={!access.isPremium}
            lockOutcomes={!access.isPremium}
            isEstimated
          />
        </Reveal>

        {active.data.stories[0] && (
          <Reveal delay={320}>
            <CommunityStoriesPanel
              stories={active.data.stories}
              title="30일 후 - 관측된 결과"
              centered
              blurLocked={!access.isPremium}
              lockedCount={Math.max(active.data.stories.length - 1, 52)}
              isEstimated
              keyword={active.keyword}
            />
          </Reveal>
        )}

        {!access.isMember && (
          <Reveal delay={360}>
            <ConversionGate step={2} keyword={active.keyword} compact />
          </Reveal>
        )}

        {access.isMember && !access.isPremium && (
          <Reveal delay={380}>
            <ConversionGate step={3} keyword={active.keyword} compact />
          </Reveal>
        )}

        {!access.isPremium && (
          <Reveal delay={400}>
            <AppLink to="/explore" className="btn-secondary text-sm min-h-[2.75rem]">
              {CTA_EXPLORE} →
            </AppLink>
          </Reveal>
        )}

        <Reveal delay={420}>
          <ServiceIntroAccordion />
        </Reveal>
      </div>

      <StickyHomeCta
        label={ctaLabel}
        hint={
          access.isPremium
            ? HINT_PREMIUM
            : access.isMember
              ? HINT_MEMBER
              : HINT_GUEST
        }
      />
    </>
  );
}
