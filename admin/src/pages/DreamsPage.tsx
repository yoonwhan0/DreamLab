import { PageHeader } from "@admin/components/AdminUi";
import { DreamSpreadsheet } from "@admin/components/DreamSpreadsheet";

export function DreamsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="꿈 DB"
        desc="DB 양식 · DB 다운로드 · DB 업로드(추가)로 시드 데이터를 넣고, 회원 기록은 엑셀처럼 조회합니다."
      />
      <DreamSpreadsheet />
    </div>
  );
}
