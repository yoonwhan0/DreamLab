/**
 * "해몽은 여기까지입니다" — 해몽(추론)에서 실제 기록(30일 뒤 데이터)으로 넘어가는 구분선.
 * DreamLab의 핵심 전환점이라 시각적으로 분명하게 끊어준다.
 */
export function LabHandoffDivider() {
  return (
    <div className="space-y-3 py-6 text-center">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="section-label !mb-0">연구 전환</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <p className="text-lg font-bold text-text leading-snug">
        해몽은 여기까지입니다.
      </p>
      <p className="text-sm text-text-secondary copy-lines px-4 leading-relaxed">
        DreamLab은 이제 같은 꿈을 꾼 사람들의
        <br />
        30일 뒤 기록을 보여줍니다.
      </p>
    </div>
  );
}
