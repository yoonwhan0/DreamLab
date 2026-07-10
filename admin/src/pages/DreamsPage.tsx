import { PageHeader } from "@admin/components/AdminUi";
import { DreamSpreadsheet } from "@admin/components/DreamSpreadsheet";

export function DreamsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="꿈 DB"
        desc="엑셀처럼 보고 · 템플릿 다운로드 · xlsx 업로드로 시드 데이터를 넣을 수 있습니다. (최대 500건 조회)"
      />
      <DreamSpreadsheet />
    </div>
  );
}
