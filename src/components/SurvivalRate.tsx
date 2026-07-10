interface SurvivalRateProps {
  totalDreams: number;
  totalWithFollowUp: number;
}

export function SurvivalRate({
  totalDreams,
  totalWithFollowUp,
}: SurvivalRateProps) {
  const rate =
    totalDreams > 0
      ? Math.round((totalWithFollowUp / totalDreams) * 100)
      : 0;

  return (
    <div className="card-highlight p-5">
      <p className="section-label">한 달 뒤, 답을 연 사람들</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-bold text-primary tabular-nums">{rate}%</p>
          <p className="text-sm text-text-secondary mt-1">
            <span className="font-medium text-text tabular-nums">
              {totalWithFollowUp.toLocaleString()}
            </span>
            /{totalDreams.toLocaleString()}명이 30일 후 답변
          </p>
        </div>
      </div>
      <div className="stat-bar-track mt-4">
        <div className="stat-bar-fill" style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}
