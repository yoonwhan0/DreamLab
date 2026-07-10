/** 문자열 시드로 결정적 난수 (같은 꿈 → 같은 수치, 다른 꿈 → 다른 수치) */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function seededInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
