import { useEffect, useState } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { PAGE_COPY } from "@/lib/productIdeas";
import { Link } from "react-router-dom";
import { DreamCard } from "@/components/DreamCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { getUserDreams } from "@/services/dreamService";
import type { Dream } from "@/types";

export function MyDreamsPage() {
  const { user, loading: authLoading } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      const data = await getUserDreams(user.uid);
      setDreams(data);
      setLoading(false);
    }
    load();
  }, [user]);

  if (authLoading || loading) {
    return <LoadingSpinner label="꿈 목록 불러오는 중" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <PageHero
          title={PAGE_COPY.myDreams.title}
          desc={PAGE_COPY.myDreams.desc}
          centered={false}
          className="min-w-0 flex-1"
        />
        <Link to="/write" className="btn-secondary !w-auto !min-h-[2.5rem] px-4 text-sm">
          새 꿈
        </Link>
      </div>

      {dreams.length === 0 ? (
        <EmptyState
          title="아직 꿈이 없습니다"
          description="첫 꿈을 적으면 30일 타이머가 시작됩니다 — 한 달 뒤, '그 꿈 이후?'"
          actionLabel="첫 꿈 적기"
          actionTo="/write"
        />
      ) : (
        <div className="space-y-3">
          {dreams.map((dream) => (
            <DreamCard key={dream.id} dream={dream} />
          ))}
        </div>
      )}
    </div>
  );
}
