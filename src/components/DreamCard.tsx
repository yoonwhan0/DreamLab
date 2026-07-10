import { AppLink } from "@/components/ui/AppLink";

import type { Dream } from "@/types";

import { DreamJourneyStepper } from "@/components/DreamJourneyStepper";

import { EmotionIconGroup } from "@/components/ui/Icon";



export function DreamCard({ dream }: { dream: Dream }) {

  const answered = Boolean(dream.followUp);



  return (

    <AppLink
      to={`/dream/${dream.id}`}
      className="card card-bezel card-glow block p-4 transition-shadow active:scale-[0.99]"
    >

      <div className="flex items-start justify-between gap-2 mb-2">

        {dream.title ? (

          <p className="font-semibold text-text line-clamp-1 flex-1">{dream.title}</p>

        ) : (

          <p className="font-semibold text-text line-clamp-1 flex-1 text-text-secondary">

            꿈 기록

          </p>

        )}

      </div>



      <DreamJourneyStepper

        createdAt={dream.createdAt}

        followUpDueAt={dream.followUpDueAt}

        answered={answered}

        compact

      />



      <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{dream.content}</p>



      <div className="mt-3 flex items-center justify-between">

        <EmotionIconGroup ids={dream.emotions} size="sm" />

        <span className="text-xs text-text-muted">

          {dream.createdAt.toLocaleDateString("ko-KR")}

        </span>

      </div>

    </AppLink>

  );

}

