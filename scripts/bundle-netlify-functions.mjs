import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const functionsDir = path.join(root, "netlify/functions");
const files = readdirSync(functionsDir).filter((name) => name.endsWith(".ts"));

for (const file of files) {
  const entry = path.join(functionsDir, file);
  process.stdout.write(`bundling ${file}… `);
  try {
    execFileSync(
      "npx",
      [
        "esbuild",
        entry,
        "--bundle",
        "--platform=node",
        "--format=cjs",
        "--log-level=error",
        "--outfile=/dev/null",
      ],
      { cwd: root, stdio: "pipe" },
    );
    process.stdout.write("ok\n");
  } catch (err) {
    process.stderr.write("\n");
    process.stderr.write(err.stderr?.toString() ?? String(err));
    process.exit(1);
  }
}

console.log(`✓ ${files.length} Netlify functions bundle cleanly`);
