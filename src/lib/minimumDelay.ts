/** API가 너무 빨리 끝나도 최소 대기 — AI 작성 연출용 */
export async function withMinimumDelay<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (ms <= 0) return promise;
  const [result] = await Promise.all([
    promise,
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    }),
  ]);
  return result;
}
