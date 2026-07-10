import { AppLink } from "@/components/ui/AppLink";
import { AppIcons, Icon } from "@/components/ui/Icon";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
}: EmptyStateProps) {
  return (
    <div className="card p-8 text-center space-y-3">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
        <Icon icon={AppIcons.archive} size="lg" className="text-primary" />
      </div>
      <p className="font-semibold text-text">{title}</p>
      <p className="text-sm text-text-secondary">{description}</p>
      {actionLabel && actionTo && (
        <AppLink to={actionTo} className="inline-block text-sm font-medium text-primary">
          {actionLabel}
        </AppLink>
      )}
    </div>
  );
}
