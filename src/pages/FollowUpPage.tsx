import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EmotionPicker } from "@/components/EmotionPicker";
import { PageHero } from "@/components/ui/PageHero";
import { PAGE_COPY } from "@/lib/productIdeas";
import { AppIcons, Icon } from "@/components/ui/Icon";
import { getDream, submitFollowUp } from "@/services/dreamService";
import {
  FOLLOWUP_EMOTIONS,
  OUTCOME_CATEGORIES,
  type FollowUpEmotionId,
  type OutcomeCategory,
} from "@/types";

export function FollowUpPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dreamTitle, setDreamTitle] = useState("");
  const [dreamContent, setDreamContent] = useState("");
  const [outcome, setOutcome] = useState<OutcomeCategory | null>(null);
  const [emotions, setEmotions] = useState<FollowUpEmotionId[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getDream(id).then((d) => {
      if (d) {
        setDreamTitle(d.title);
        setDreamContent(d.content);
      }
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!outcome) {
      setError("결과 카테고리를 선택해주세요.");
      return;
    }
    if (emotions.length === 0) {
      setError("지금의 감정을 1개 이상 선택해주세요.");
      return;
    }
    if (note.trim().length < 8) {
      setError("한 달 뒤 경험을 8자 이상 적어주세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await submitFollowUp(id, {
        outcomeCategory: outcome,
        emotions,
        note: note.trim(),
      });
      navigate(`/dream/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHero title={PAGE_COPY.followUp.title} desc={PAGE_COPY.followUp.desc} />
      <p className="page-desc -mt-3 text-center text-sm text-text-muted line-clamp-2">
        {dreamTitle || dreamContent.slice(0, 60)}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 card p-4">
        <div>
          <label className="section-label mb-2 block">한 달 뒤, 어떤 일이 있었나요?</label>
          <OutcomePickerInline selected={outcome} onChange={setOutcome} />
        </div>

        <div>
          <label className="section-label mb-2 block">지금의 감정</label>
          <EmotionPicker
            emotions={FOLLOWUP_EMOTIONS}
            selected={emotions}
            onChange={(sel) => setEmotions(sel as FollowUpEmotionId[])}
          />
        </div>

        <div>
          <label className="section-label mb-2 block">후기</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="한 달 전 그 꿈 — 현실에선 어떻게 흘러갔나요? 구체적으로 적을수록 통계에 도움이 됩니다."
            className="input min-h-[7rem]"
            required
            minLength={8}
          />
          <p className="mt-1 text-xs text-text-muted text-right tabular-nums">{note.length}자</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
          <span className="inline-flex items-center gap-2">
            {submitting ? "저장 중..." : "후기 제출"}
            <Icon icon={AppIcons.gift} size="sm" className="text-white" />
          </span>
        </button>
      </form>

      <p className="text-center text-xs text-text-muted">
        익명 통계 · 미리 적어도 됩니다 · 안 적으면 30일에 알림
      </p>
    </div>
  );
}

function OutcomePickerInline({
  selected,
  onChange,
}: {
  selected: OutcomeCategory | null;
  onChange: (v: OutcomeCategory) => void;
}) {
  const entries = Object.entries(OUTCOME_CATEGORIES) as [OutcomeCategory, string][];

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`chip ${selected === id ? "chip-primary ring-2 ring-primary/30" : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
