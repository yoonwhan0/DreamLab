import type { LucideIcon, LucideProps } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  CloudRain,
  Gift,
  Heart,
  HelpCircle,
  Home,
  Bell,
  Leaf,
  Loader2,
  Lock,
  Moon,
  PenLine,
  Search,
  Smile,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import type { DreamEmotionId, FollowUpEmotionId } from "@/types";

const SIZES = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
} as const;

type IconSize = keyof typeof SIZES;

interface IconProps extends Omit<LucideProps, "size"> {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
}

export function Icon({ icon: Lucide, size = "md", className = "", ...props }: IconProps) {
  return (
    <Lucide
      className={`shrink-0 ${SIZES[size]} ${className}`}
      strokeWidth={1.75}
      aria-hidden
      {...props}
    />
  );
}

export const AppIcons = {
  logo: Moon,
  home: Home,
  write: PenLine,
  archive: BookOpen,
  explore: Search,
  user: User,
  lock: Lock,
  bell: Bell,
  search: Search,
  gift: Gift,
  spinner: Loader2,
} as const;

export type NavIconKey = keyof Pick<
  typeof AppIcons,
  "home" | "write" | "archive" | "explore" | "user"
>;

const EMOTION_ICONS: Record<DreamEmotionId | FollowUpEmotionId, LucideIcon> = {
  happy: Smile,
  scared: AlertTriangle,
  sad: CloudRain,
  calm: Leaf,
  weird: HelpCircle,
  grateful: Heart,
  anxious: AlertTriangle,
  hopeful: Sun,
};

interface EmotionIconProps {
  id: DreamEmotionId | FollowUpEmotionId | string;
  size?: IconSize;
  className?: string;
}

export function EmotionIcon({ id, size = "sm", className = "" }: EmotionIconProps) {
  const Lucide = EMOTION_ICONS[id as DreamEmotionId] ?? Sparkles;
  return <Icon icon={Lucide} size={size} className={className} />;
}

export function EmotionIconGroup({
  ids,
  size = "sm",
  className = "",
}: {
  ids?: (DreamEmotionId | FollowUpEmotionId | string)[];
  size?: IconSize;
  className?: string;
}) {
  const safeIds = ids ?? [];
  if (safeIds.length === 0) return null;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {safeIds.map((id) => (
        <EmotionIcon key={id} id={id} size={size} />
      ))}
    </span>
  );
}

export function LoadingSpinner({
  size = "lg",
  label = "불러오는 중",
}: {
  size?: IconSize;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20" role="status" aria-live="polite">
      <Icon
        icon={Loader2}
        size={size}
        className="animate-spin text-primary"
      />
      <p className="text-sm font-medium text-text-secondary">{label}</p>
    </div>
  );
}
