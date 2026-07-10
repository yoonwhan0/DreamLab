import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DreamArchiveCard } from "@/components/DreamArchiveCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { PAGE_COPY } from "@/lib/productIdeas";
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
    void load();
  }, [user]);

  if (authLoading || loading) {
    return <LoadingSpinner label="아카이브 불러오는 중" />;
  }

  const answered = dreams.filter((d) => d.followUp);
  const waiting = dreams.filter((d) => !d.followUp);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <PageHero
          title={PAGE_COPY.myDreams.title}
          desc={PAGE_COPY.myDreams.desc}
          centered={false}
          className="min-w-0 flex-1"
        />
        <Link to="/write" className="btn-secondary !w-auto !min-h-[2.5rem] px-4 text-sm shrink-0">
          새 꿈
        </Link>
      </div>

      {dreams.length === 0 ? (
        <EmptyState
          title="아직 꿈이 없습니다"
          description="첫 꿈을 적으면 30일 타이머가 시작됩니다 — 한 달 뒤, 내 후기가 여기에 남습니다."
          actionLabel="첫 꿈 적기"
          actionTo="/write"
        />
      ) : (
        <>
          {answered.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                30일 후기 있음 · {answered.length}건
              </h2>
              {answered.map((dream) => (
                <DreamArchiveCard key={dream.id} dream={dream} />
              ))}
            </section>
          )}

          {waiting.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                대기 중 · {waiting.length}건
              </h2>
              {waiting.map((dream) => (
                <DreamArchiveCard key={dream.id} dream={dream} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
