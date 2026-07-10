import { PageHeader } from "@admin/components/AdminUi";
import { DreamSpreadsheet } from "@admin/components/DreamSpreadsheet";

export function DreamsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="꿈 DB"
        desc="Firestore dreams 전체 필드(해몽·30일 후기·메타)를 누락 없이 표시 · DB 양식/다운로드/업로드(추가)"
      />
      <DreamSpreadsheet />
    </div>
  );
}
