import { EmotionIcon } from "@/components/ui/Icon";

interface EmotionOption {
  id: string;
  label: string;
}

interface EmotionPickerProps {
  emotions: readonly EmotionOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  max?: number;
}

export function EmotionPicker({
  emotions,
  selected,
  onChange,
  max = 3,
}: EmotionPickerProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((e) => e !== id));
    } else if (selected.length < max) {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {emotions.map((emotion) => {
        const isSelected = selected.includes(emotion.id);
        return (
          <button
            key={emotion.id}
            type="button"
            onClick={() => toggle(emotion.id)}
            className={`flex min-h-[3rem] items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              isSelected
                ? "bg-primary text-white shadow-sm"
                : "card text-text-secondary hover:bg-surface-2"
            }`}
          >
            <EmotionIcon
              id={emotion.id}
              size="sm"
              className={isSelected ? "text-white" : "text-primary"}
            />
            <span>{emotion.label}</span>
          </button>
        );
      })}
    </div>
  );
}
