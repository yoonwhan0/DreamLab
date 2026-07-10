import { FOLLOWUP_DAYS } from "@/types";

const devShortFollowup =
  typeof import.meta !== "undefined" &&
  import.meta.env?.VITE_DEV_SHORT_FOLLOWUP === "true";

export function getFollowUpDueDate(from: Date = new Date()): Date {
  const due = new Date(from);
  due.setTime(
    due.getTime() + (devShortFollowup ? 60_000 : FOLLOWUP_DAYS * 24 * 60 * 60 * 1000),
  );
  return due;
}
