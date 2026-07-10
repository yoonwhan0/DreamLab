import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useSignupSheet } from "@/hooks/useSignupSheet";
import { LoadingSpinner } from "@/components/ui/Icon";

export function MemberRoute({ children }: { children: React.ReactNode }) {
  const { isMember, loading } = useAccessPolicy();
  const { openSignupSheet } = useSignupSheet();

  useEffect(() => {
    if (!loading && !isMember) {
      openSignupSheet("30일 후 데이터를 기록하고 알림을 받으려면 로그인하거나 가입하세요.");
    }
  }, [loading, isMember, openSignupSheet]);

  if (loading) {
    return <LoadingSpinner label="확인 중" />;
  }

  if (!isMember) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-text-secondary">회원 전용 기능입니다</p>
        <Link to="/" className="text-sm text-primary font-medium">
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

  useEffect(() => {
    if (!loading && !isMember) {
      openSignupSheet();
    }
  }, [loading, isMember, openSignupSheet]);

  if (loading) {
    return <LoadingSpinner label="확인 중" />;
  }

  if (!isMember) {
    return (
      <div className="py-16 text-center">
        <Link to="/my" className="text-primary font-medium">
          마이페이지에서 로그인 · 가입
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
