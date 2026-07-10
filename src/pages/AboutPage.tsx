import { LabResearchMissionBody } from "@/components/LabResearchMission";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/ui/PageHero";
import { PAGE_COPY } from "@/lib/productIdeas";

export function AboutPage() {
  const copy = PAGE_COPY.about;

  return (
    <div className="space-y-5 pb-4">
      <Reveal delay={0}>
        <PageHero
          label={copy.label}
          title={copy.title}
          desc={copy.desc}
          centered
        />
      </Reveal>

      <Reveal delay={60}>
        <div className="card card-bezel p-4">
          <LabResearchMissionBody />
        </div>
      </Reveal>
    </div>
  );
}
