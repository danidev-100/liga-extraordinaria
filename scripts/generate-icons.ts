/**
 * Generate PWA PNG icons from public/icon.jpg.
 *
 * Outputs:
 *   public/icon-192.png          — 192x192 (any, full bleed)
 *   public/icon-512.png          — 512x512 (any, full bleed)
 *   public/icon-maskable-512.png — 512x512 (maskable, 72% safe-zone)
 *   public/apple-touch-icon.png  — 180x180 (iOS, 80% safe-zone)
 *   src/app/favicon.ico          — 32x32 legacy favicon
 *
 * Maskable and iOS icons get a transparent safe-zone margin so the logo is
 * not cropped by launcher masks (Google recommends content inside the inner
 * 72%; Apple masks with rounded corners).
 *
 * Usage: pnpm icons:generate
 */

import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const ICON_SOURCE = path.join(process.cwd(), "public", "icon.jpg")
const OUT_DIR = path.join(process.cwd(), "public")
const APP_DIR = path.join(process.cwd(), "src", "app")

const TARGETS = [
  { file: "icon-192.png", size: 192, scale: 1 },
  { file: "icon-512.png", size: 512, scale: 1 },
  { file: "icon-maskable-512.png", size: 512, scale: 0.73 },
  { file: "apple-touch-icon.png", size: 180, scale: 0.83 },
]

/** Resize to `size`, keeping the logo inside a transparent safe-zone when scale < 1. */
async function buildIcon(source: Buffer, size: number, scale: number): Promise<Buffer> {
  if (scale >= 1) {
    return sharp(source).resize(size, size).ensureAlpha().png().toBuffer()
  }
  const inner = Math.max(1, Math.round(size * scale))
  const logo = await sharp(source).resize(inner, inner).ensureAlpha().png().toBuffer()
  const offset = Math.round((size - inner) / 2)
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toBuffer()
}

/** Wrap a PNG buffer in an ICO container (Vista+ supports PNG-compressed ICO). */
function toIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // image count
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size >= 256 ? 0 : size, 0) // width
  entry.writeUInt8(size >= 256 ? 0 : size, 1) // height
  entry.writeUInt8(0, 2) // color palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // color planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(png.length, 8) // size
  entry.writeUInt32LE(22, 12) // offset
  return Buffer.concat([header, entry, png])
}

async function main() {
  const source = await readFile(ICON_SOURCE)

  for (const { file, size, scale } of TARGETS) {
    const png = await buildIcon(source, size, scale)
    await writeFile(path.join(OUT_DIR, file), png)
    const safeZone = scale < 1 ? `, safe-zone ${Math.round(scale * 100)}%` : ""
    console.log(`  ✓ ${file} (${size}x${size}${safeZone})`)
  }

  const favicon = await sharp(source).resize(32, 32).ensureAlpha().png().toBuffer()
  await writeFile(path.join(APP_DIR, "favicon.ico"), toIco(favicon, 32))
  console.log("  ✓ src/app/favicon.ico (32x32)")

  console.log("\n✅ Icons generated in public/")
}

main().catch((e) => {
  console.error("❌ Icon generation failed:", e)
  process.exit(1)
})