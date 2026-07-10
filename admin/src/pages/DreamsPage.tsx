import { useEffect, useState } from "react";
import { PageHeader, DataTable } from "@admin/components/AdminUi";
import { fetchDreams } from "@admin/services/adminMetrics";
import type { Dream } from "@/types";

export function DreamsPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchDreams().then((data) => {
      setDreams(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="꿈 DB" desc="최근 꿈 기록 500건 — admin 전용 조회" />

      <DataTable
        emptyLabel={loading ? "불러오는 중…" : "꿈 기록 없음"}
        columns={[
          { key: "title", label: "제목" },
          { key: "user", label: "User" },
          { key: "keywords", label: "키워드" },
          { key: "followUp", label: "30일" },
          { key: "created", label: "작성일" },
        ]}
        rows={dreams.map((d) => ({
          title: d.title || d.content.slice(0, 24) + "…",
          user: d.userId.slice(0, 8),
          keywords: d.interpretation?.keywords?.slice(0, 3).join(", ") ?? "—",
          followUp: d.followUp ? "완료" : d.followUpDueAt <= new Date() ? "대기" : "진행중",
          created: d.createdAt.toLocaleDateString("ko-KR"),
        }))}
      />
    </div>
  );
}
