import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CuriosityTease } from "@/components/CuriosityTease";
import { LoadingPulse } from "@/components/motion/LoadingPulse";
import { PageHero } from "@/components/ui/PageHero";
import { PAGE_COPY } from "@/lib/productIdeas";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { inferEmotionsFromInterpretation, parseDreamInput } from "@/lib/dreamUtils";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { interpretDream } from "@/services/interpretService";
import { saveDream } from "@/services/dreamService";
import type { CommunityEstimate, DreamEmotionId, DreamInterpretation } from "@/types";

interface PendingDream {
  title: string;
  content: string;
  interpretation: DreamInterpretation;
  embedding: number[];
  communityEstimate?: CommunityEstimate;
  emotions: DreamEmotionId[];
}

export function WriteDreamPage() {
  const navigate = useNavigate();
  const { canSaveDream, loading: authLoading } = useAccessPolicy();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const finishDream = async (dreamData: PendingDream) => {
    if (canSaveDream && auth?.currentUser && isFirebaseConfigured) {
      const dreamId = await saveDream(
        auth.currentUser.uid,
        dreamData.title,
        dreamData.content,
        dreamData.emotions,
        dreamData.interpretation,
        dreamData.embedding,
      );
      navigate(`/dream/${dreamId}?new=1`);
      return;
    }

    sessionStorage.setItem("pendingDream", JSON.stringify(dreamData));
    navigate("/dream/preview?new=1");
  };

  const handleInterpret = async (e: React.FormEvent) => {
    e.preventDefault();

    if (content.trim().length < 10) {
      setError("꿈 내용을 10자 이상 적어주세요.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const parsed = parseDreamInput(content.trim());
      const { interpretation, embedding, communityEstimate } = await interpretDream(
        parsed.title,
        parsed.content,
      );

      await finishDream({
        title: parsed.title,
        content: parsed.content,
        interpretation,
        embedding,
        communityEstimate,
        emotions: inferEmotionsFromInterpretation(interpretation),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHero title={PAGE_COPY.write.title} desc={PAGE_COPY.write.desc} />

      <form onSubmit={handleInterpret} className="space-y-5">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="예: 초록색 큰 뱀이 현관문을 열고 들어왔어요. 무섭긴 했는데 쫓아오진 않았어요…"
            className="input min-h-[12rem]"
            disabled={submitting}
            autoFocus
          />
          <p className="mt-1 text-right text-xs text-text-muted tabular-nums">
            {content.length}자
          </p>
        </div>

        {submitting ? (
          <LoadingPulse label="꿈 내용 분석 중..." />
        ) : (
          <>
            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={authLoading}
              className="btn-primary disabled:opacity-50"
            >
              기록하고 해석받기
            </button>
          </>
        )}
      </form>

      {!submitting && (
        <CuriosityTease
          title="같은 꿈을 꾼 사람들, 30일 뒤는?"
          body="기록 전에도 탐색에서 비슷한 꿈·한 달 뒤 후기를 미리 볼 수 있어요."
          cta="탐색으로 가기"
          to="/explore"
        />
      )}
    </div>
  );
}
