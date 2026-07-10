import { DreamJourneyStepper } from "@/components/DreamJourneyStepper";
import { FormattedBlocks } from "@/components/ui/FormattedText";

interface JourneyOnboardingCardProps {
  createdAt: Date;
  followUpDueAt: Date;
  isPreview?: boolean;
  isGuest?: boolean;
}

export function JourneyOnboardingCard({
  createdAt,
  followUpDueAt,
  isPreview = false,
  isGuest = false,
}: JourneyOnboardingCardProps) {
  const message = isPreview
    ? "회원가입하면 이 꿈이 저장되고, 한 달 뒤 '그 꿈 이후?' 알림이 옵니다. 답이 쌓일수록 같은 꿈을 꾼 사람들의 통계가 열립니다."
    : isGuest
      ? "꿈 내용은 저장됐습니다. 회원가입하면 유사 꿈·30일 푸시 알림·후기 작성이 열립니다."
      : "꿈이 저장됐습니다. 한 달 뒤 알림이 오면 실제 경험을 남겨 주세요 — 당신의 답이 다음 사람의 통계가 됩니다.";

  return (
    <div className="card-highlight p-5 space-y-3">
      <p className="section-label">당신의 꿈, 30일 타이머</p>
      <FormattedBlocks className="text-[0.9375rem] text-text-secondary" maxLines={4}>
        {message}
      </FormattedBlocks>
      <DreamJourneyStepper
        createdAt={createdAt}
        followUpDueAt={followUpDueAt}
      />
    </div>
  );
}
