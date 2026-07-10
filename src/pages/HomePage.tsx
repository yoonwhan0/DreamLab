import { useMemo } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { CuriosityTease } from "@/components/CuriosityTease";
import { LabResearchMission } from "@/components/LabResearchMission";
import { HomeFeaturedStoryPanel } from "@/components/HomeFeaturedStoryPanel";
import { HomeObservatorySignal } from "@/components/HomeObservatorySignal";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/ui/PageHero";
import { CTA_SIGNUP, CTA_WRITE_DREAM } from "@/lib/branding";
import { PAGE_COPY } from "@/lib/productIdeas";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useSignupSheet } from "@/hooks/useSignupSheet";
import { useHomeFeaturedKeywords } from "@/hooks/useHomeFeaturedKeywords";
import { getKeywordIcon } from "@/lib/keywordIcons";
import { previewKeywordLabel } from "@/lib/previewKeywords";
import { previewCommunityForKeyword } from "@/services/syntheticCommunityService";

export function HomePage() {
  const access = useAccessPolicy();
  const { openSignupSheet } = useSignupSheet();
  const { keywords, activeIdx, setActiveIdx } = useHomeFeaturedKeywords();
  const activeKeyword = keywords[activeIdx] ?? keywords[0];
  const activePreview = useMemo(() => {
    if (!activeKeyword) return null;
    return {
      keyword: activeKeyword,
      label: previewKeywordLabel(activeKeyword),
      data: previewCommunityForKeyword(activeKeyword),
    };
  }, [activeKeyword]);
  const hero = PAGE_COPY.home;

  return (
    <div className="home-page space-y-5 pb-4">
      <Reveal delay={0}>
        <div className="space-y-3">
          <PageHero
            label={hero.label}
            title={hero.title}
            descLead={hero.descLead}
            descMid={hero.descMid}
            descAccent={hero.descAccent}
            centered
          />
          <LabResearchMission variant="hero" openOnHash />
        </div>
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
          <p className="text-xs text-text-muted px-1">이런 꿈, 한 달 뒤는?</p>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, i) => (
              <button
                key={`${keyword}-${i}`}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`chip ${i === activeIdx ? "chip-primary" : ""}`}
              >
                <span className="mr-1" aria-hidden>
                  {getKeywordIcon(keyword)}
                </span>
                {keyword}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {activePreview?.data.stories[0] && (
        <Reveal delay={120}>
          <HomeFeaturedStoryPanel
            keyword={activePreview.keyword}
            label={activePreview.label}
            estimate={activePreview.data}
          />
        </Reveal>
      )}

      {access.isGuest && (
        <Reveal delay={170}>
          <CuriosityTease
            title="로그인 · 가입 · 꿈 저장"
            body="가입하면 탐색에서 같은 꿈 후기를 더 볼 수 있어요. 이미 계정이 있으면 로그인하세요."
            cta={CTA_SIGNUP}
            onAction={() =>
              openSignupSheet("탐색·후기·30일 알림을 열려면 로그인하거나 가입하세요.")
            }
          />
        </Reveal>
      )}

      <Reveal delay={160}>
        <AppLink
          to="/explore"
          className="block text-center text-sm text-text-muted hover:text-primary transition-colors py-2"
        >
          30일 뒤 결말, 더 보기 →
        </AppLink>
      </Reveal>
    </div>
  );
}
