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

  const [showDetail, setShowDetail] = useState(false);

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



  const submit = async (data: {

    outcomeCategory: OutcomeCategory;

    emotions: FollowUpEmotionId[];

    note: string;

  }) => {

    if (!id) return;

    setSubmitting(true);

    setError("");

    try {

      await submitFollowUp(id, data);

      navigate(`/dream/${id}`);

    } catch (err) {

      setError(err instanceof Error ? err.message : "저장 실패");

    } finally {

      setSubmitting(false);

    }

  };



  const handleQuickNothing = () => {

    submit({

      outcomeCategory: "nothing",

      emotions: ["calm"],

      note: "별일 없었음",

    });

  };



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!outcome) {

      setError("결과 카테고리를 선택해주세요.");

      return;

    }

    if (emotions.length === 0) {

      setError("지금의 감정을 1개 이상 선택해주세요.");

      return;

    }

    await submit({

      outcomeCategory: outcome,

      emotions,

      note: note.trim() || "답변 없음",

    });

  };



  return (

    <div className="space-y-6">

      <PageHero title={PAGE_COPY.followUp.title} desc={PAGE_COPY.followUp.desc} />
      <p className="page-desc -mt-3 text-center text-sm text-text-muted line-clamp-2">
        {dreamTitle || dreamContent.slice(0, 60)}
      </p>



      <button

        type="button"

        onClick={handleQuickNothing}

        disabled={submitting}

        className="w-full rounded-2xl border-2 border-primary/30 bg-primary-soft/50 p-6 text-center transition active:scale-[0.99] disabled:opacity-50"

      >

        <p className="text-2xl mb-2">👍</p>

        <p className="text-lg font-bold text-text">진짜 별일 없었어요</p>

        <p className="mt-1 text-sm text-text-secondary">원탭으로 제출 · 통계에 반영</p>

      </button>



      <div className="relative text-center">

        <span className="text-xs text-text-muted bg-bg px-3 relative z-10">또는 자세히</span>

        <div className="absolute inset-x-0 top-1/2 h-px bg-border -z-0" />

      </div>



      {!showDetail ? (

        <button

          type="button"

          onClick={() => setShowDetail(true)}

          className="btn-secondary text-sm"

        >

          다른 결과 · 자세히 적기

        </button>

      ) : (

        <form onSubmit={handleSubmit} className="space-y-5 card p-4">

          <OutcomePickerInline selected={outcome} onChange={setOutcome} />



          <div>

            <label className="section-label mb-2 block">지금의 감정</label>

            <EmotionPicker

              emotions={FOLLOWUP_EMOTIONS}

              selected={emotions}

              onChange={(sel) => setEmotions(sel as FollowUpEmotionId[])}

            />

          </div>



          <textarea

            value={note}

            onChange={(e) => setNote(e.target.value)}

            placeholder="한 달 전 그 꿈 — 현실에선 어떻게 흘러갔나요?"

            className="input"

          />



          {error && <p className="text-sm text-red-600">{error}</p>}



          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">

            <span className="inline-flex items-center gap-2">

              {submitting ? "저장 중..." : "후기 제출"}

              <Icon icon={AppIcons.gift} size="sm" className="text-white" />

            </span>

          </button>

        </form>

      )}



      <p className="text-center text-xs text-text-muted">

        익명 통계 · 답변 시 구독 할인 자격

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

