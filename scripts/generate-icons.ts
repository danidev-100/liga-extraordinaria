/**
 * Generate PWA PNG icons from public/icon.svg.
 *
 * Outputs:
 *   public/icon-192.png          — 192x192 (any)
 *   public/icon-512.png          — 512x512 (any)
 *   public/icon-maskable-512.png — 512x512 (maskable)
 *   public/apple-touch-icon.png  — 180x180 (iOS)
 *
 * Usage: pnpm icons:generate
 */

import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const ICON_SVG = path.join(process.cwd(), "public", "icon.svg")
const OUT_DIR = path.join(process.cwd(), "public")

const TARGETS = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-maskable-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
]

async function main() {
  const svg = await readFile(ICON_SVG)

  for (const { file, size } of TARGETS) {
    const png = await sharp(svg).resize(size, size).png().toBuffer()
    await writeFile(path.join(OUT_DIR, file), png)
    console.log(`  ✓ ${file} (${size}x${size})`)
  }

  console.log("\n✅ Icons generated in public/")
}

main().catch((e) => {
  console.error("❌ Icon generation failed:", e)
  process.exit(1)
})