import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'web', 'public', 'icons')

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function pngFromRgba(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function makeIcon(size) {
  const bg = [0x1e, 0x40, 0xaf]
  const rgba = Buffer.alloc(size * size * 4)
  const s = size / 512
  const stroke = 44 * s
  const radius = 96 * s

  const [ax, ay, bx, by, cx, cy] = [148 * s, 268 * s, 226 * s, 350 * s, 372 * s, 172 * s]

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const rx = Math.max(radius - x, x - (size - 1 - radius), 0)
      const ry = Math.max(radius - y, y - (size - 1 - radius), 0)
      if (Math.hypot(rx, ry) > radius) continue

      const d = Math.min(
        distToSegment(x, y, ax, ay, bx, by),
        distToSegment(x, y, bx, by, cx, cy)
      )
      const t = Math.max(0, Math.min(1, stroke / 2 + 1 - d))
      rgba[i] = Math.round(bg[0] + (255 - bg[0]) * t)
      rgba[i + 1] = Math.round(bg[1] + (255 - bg[1]) * t)
      rgba[i + 2] = Math.round(bg[2] + (255 - bg[2]) * t)
      rgba[i + 3] = 255
    }
  }
  return pngFromRgba(size, size, rgba)
}

mkdirSync(OUT_DIR, { recursive: true })
for (const size of [192, 512]) {
  const file = path.join(OUT_DIR, `icon-${size}.png`)
  writeFileSync(file, makeIcon(size))
  console.log(`wrote ${file}`)
}
