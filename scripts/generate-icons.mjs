import { copyFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "assets/icons/brand/dreamlab-app-icon.png");
const PUBLIC = path.join(ROOT, "public");

const SIZES = [
  { name: "favicon-16.png", size: 16 },
  { name: "favicon-32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
];

async function main() {
  await mkdir(path.join(ROOT, "assets/icons/brand"), { recursive: true });
  await mkdir(PUBLIC, { recursive: true });

  for (const { name, size } of SIZES) {
    await sharp(SOURCE)
      .resize(size, size, { fit: "cover", position: "centre" })
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUBLIC, name));
    console.log(`✓ public/${name} (${size}px)`);
  }

  // PWA maskable — same asset, platforms crop safe zone
  await copyFile(
    path.join(PUBLIC, "pwa-512x512.png"),
    path.join(PUBLIC, "pwa-512x512-maskable.png"),
  );
  console.log("✓ public/pwa-512x512-maskable.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
