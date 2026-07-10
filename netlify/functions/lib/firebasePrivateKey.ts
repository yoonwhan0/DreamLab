/** Netlify/Vercel env — PEM private key 정규화 */
export function normalizePrivateKey(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;

  let key = raw.trim();

  if (key.startsWith("{")) return null;

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  for (let i = 0; i < 4; i++) {
    if (!key.includes("\\n")) break;
    key = key.replace(/\\n/g, "\n");
  }

  key = key.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (!key.includes("\n") && key.includes("-----BEGIN PRIVATE KEY-----")) {
    key = key
      .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
      .replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----");
  }

  if (
    !key.includes("-----BEGIN PRIVATE KEY-----") ||
    !key.includes("-----END PRIVATE KEY-----")
  ) {
    return null;
  }

  const body = key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  if (body.length < 100) return null;

  const wrapped = body.match(/.{1,64}/g)?.join("\n") ?? body;

  return `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----\n`;
}
