import { useEffect, useState } from "react";
import { PageHeader, DataTable, StatCard } from "@admin/components/AdminUi";
import { fetchDreams, fetchFollowUpQueue } from "@admin/services/adminMetrics";
import type { Dream } from "@/types";

export function FollowUpPage() {
  const [queue, setQueue] = useState<Dream[]>([]);
  const [all, setAll] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([fetchFollowUpQueue(), fetchDreams()]).then(([q, dreams]) => {
      setQueue(q);
      setAll(dreams);
      setLoading(false);
    });
  }, []);

  const completed = all.filter((d) => d.followUp).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-up 관리"
        desc="30일 후기 대기·완료 현황 (Functions 푸시와 연동 예정)"
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <StatCard label="답변 완료" value={loading ? "…" : completed} accent />
        <StatCard label="답변 대기" value={loading ? "…" : queue.length} />
        <StatCard label="전체 꿈" value={loading ? "…" : all.length} />
      </div>

      <DataTable
        emptyLabel={loading ? "불러오는 중…" : "대기 중인 follow-up 없음"}
        columns={[
          { key: "title", label: "꿈" },
          { key: "due", label: "due" },
          { key: "user", label: "User" },
        ]}
        rows={queue.map((d) => ({
          title: d.title || d.content.slice(0, 30),
          due: d.followUpDueAt.toLocaleDateString("ko-KR"),
          user: d.userId.slice(0, 8),
        }))}
      />
    </div>
  );
}
