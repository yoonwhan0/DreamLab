import { Link } from "react-router-dom";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useSignupSheet } from "@/hooks/useSignupSheet";
import { LoadingSpinner } from "@/components/ui/Icon";
import { CTA_SIGNUP } from "@/lib/branding";

export function MemberRoute({ children }: { children: React.ReactNode }) {
  const { isMember, loading } = useAccessPolicy();
  const { openSignupSheet } = useSignupSheet();

  if (loading) {
    return <LoadingSpinner label="확인 중" />;
  }

  if (!isMember) {
    return (
      <div className="py-16 text-center space-y-4 px-4">
        <p className="text-text-secondary">회원 전용 기능입니다</p>
        <p className="text-xs text-text-muted copy-lines">
          Google로 가입하면 30일 알림·후기 작성이 열립니다.
        </p>
        <button
          type="button"
          className="btn-primary text-sm"
          onClick={() =>
            openSignupSheet("Google로 가입하면 30일 알림·후기 작성이 열립니다.")
          }
        >
          {CTA_SIGNUP}
        </button>
        <Link to="/" className="block text-sm text-primary font-medium">
          홈으로
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export function PremiumRoute({ children }: { children: React.ReactNode }) {
  const { isPremium, isMember, loading } = useAccessPolicy();
  const { openSignupSheet } = useSignupSheet();

  if (loading) {
    return <LoadingSpinner label="확인 중" />;
  }

  if (!isMember) {
    return (
      <div className="py-16 text-center space-y-4 px-4">
        <p className="text-text-secondary">회원 전용입니다</p>
        <button
          type="button"
          className="btn-primary text-sm"
          onClick={() => openSignupSheet()}
        >
          {CTA_SIGNUP}
        </button>
        <Link to="/my" className="block text-sm text-primary font-medium">
          마이페이지
        </Link>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-text-secondary">프리미엄 전용 · 한 달 뒤 통계·후기 전체</p>
        <Link to="/my" className="btn-primary !w-auto inline-flex px-6">
          프리미엄 열기
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
