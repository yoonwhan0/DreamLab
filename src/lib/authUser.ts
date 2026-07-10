import type { User } from "firebase/auth";

/** Google 연동·이메일 있으면 회원 — isAnonymous 플래그 지연 갱신 보정 */
export function isLinkedAuthUser(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.email) return true;
  return !user.isAnonymous;
}

export function isGuestAuthUser(user: User | null | undefined): boolean {
  return !isLinkedAuthUser(user);
}
