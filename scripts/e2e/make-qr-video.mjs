// Makes a fake camera feed (Y4M) showing one location QR code, for testing the scanner in Chromium.
// Usage: node scripts/e2e/make-qr-video.mjs DR-LOC:quiet-pool out.y4m
import QRCode from 'qrcode'
import { writeFileSync } from 'node:fs'

const [text = 'DR-LOC:quiet-pool', out = 'qr.y4m'] = process.argv.slice(2)
const W = 640, H = 480, FRAMES = 10
const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
const n = qr.modules.size, cell = Math.floor(300 / (n + 8))
const size = cell * (n + 8), ox = (W - size) / 2 | 0, oy = (H - size) / 2 | 0
const Y = Buffer.alloc(W * H, 200)
for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  const mx = Math.floor(x / cell) - 4, my = Math.floor(y / cell) - 4
  const dark = mx >= 0 && my >= 0 && mx < n && my < n && qr.modules.get(my, mx)
  Y[(oy + y) * W + ox + x] = dark ? 16 : 235
}
const UV = Buffer.alloc((W / 2) * (H / 2), 128)
const frame = Buffer.concat([Buffer.from('FRAME\n'), Y, UV, UV])
writeFileSync(out, Buffer.concat([Buffer.from(`YUV4MPEG2 W${W} H${H} F10:1 Ip A1:1 C420jpeg\n`), ...Array(FRAMES).fill(frame)]))
console.log('wrote', out)
