import { PageHeader } from "@admin/components/AdminUi";
import { DreamSpreadsheet } from "@admin/components/DreamSpreadsheet";

export function DreamsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="꿈 DB"
        desc="Firestore dreams — 문서ID~프로필(32열) · DB 양식/다운로드/업로드(추가)"
      />
      <DreamSpreadsheet />
    </div>
  );
}
