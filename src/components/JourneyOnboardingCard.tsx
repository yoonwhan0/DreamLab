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
  return (
    <div className="card-highlight p-5 space-y-3">
      <p className="section-label">당신의 꿈, 30일 타이머</p>
      {isPreview ? (
        <FormattedBlocks className="text-[0.9375rem] text-text-secondary" maxLines={4}>
          회원가입하면 이 꿈이 저장되고, 한 달 뒤 &lsquo;그 꿈 이후?&rsquo; 알림이 옵니다. 답이 쌓일수록 같은 꿈을 꾼 사람들의 통계가 열립니다.
        </FormattedBlocks>
      ) : isGuest ? (
        <FormattedBlocks className="text-[0.9375rem] text-text-secondary" maxLines={4}>
          꿈 내용은 저장됐습니다. 회원가입하면 유사 꿈·30일 푸시 알림·후기 작성이 열립니다.
        </FormattedBlocks>
      ) : (
        <div className="space-y-2 text-[0.9375rem] leading-relaxed text-text-secondary copy-lines">
          <p>꿈이 저장됐습니다. 후기는 지금 적어도 되고, 안 적으면 한 달 뒤 알림이 옵니다.</p>
          <p>당신의 답이 다음 사람의 통계가 됩니다.</p>
        </div>
      )}
      <DreamJourneyStepper
        createdAt={createdAt}
        followUpDueAt={followUpDueAt}
      />
    </div>
  );
}
