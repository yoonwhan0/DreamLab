import { useEffect, useState } from "react";
import { PageHeader, DataTable } from "@admin/components/AdminUi";
import { fetchMembers } from "@admin/services/adminMetrics";
import type { UserProfile } from "@/types";

export function MembersPage() {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchMembers().then((data) => {
      setMembers(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="회원"
        desc="Firestore users 컬렉션 — 최근 500명 샘플"
      />

      <DataTable
        emptyLabel={loading ? "불러오는 중…" : "회원 없음"}
        columns={[
          { key: "email", label: "이메일" },
          { key: "tier", label: "티어" },
          { key: "role", label: "역할" },
          { key: "push", label: "푸시" },
          { key: "joined", label: "가입일" },
        ]}
        rows={members.map((m) => ({
          email: m.email ?? (m.isAnonymous ? "(익명)" : m.uid.slice(0, 8)),
          tier: m.isPremium ? "Premium" : m.isAnonymous ? "Guest" : "Member",
          role: m.role === "admin" ? "admin" : "—",
          push: m.fcmTokens.length > 0 ? `${m.fcmTokens.length} 토큰` : "—",
          joined: m.createdAt.toLocaleDateString("ko-KR"),
        }))}
      />
    </div>
  );
}
