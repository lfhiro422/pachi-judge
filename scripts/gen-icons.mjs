import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function generateIcon(size, outPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, size, size);

  // Camera body
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 192;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(cx - 60 * scale, cy - 35 * scale, 120 * scale, 80 * scale, 10 * scale);
  ctx.fill();

  // Lens ring
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.arc(cx, cy + 5 * scale, 28 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4fc3f7";
  ctx.beginPath();
  ctx.arc(cx, cy + 5 * scale, 22 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Viewfinder bump
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(cx - 20 * scale, cy - 48 * scale, 40 * scale, 15 * scale, 5 * scale);
  ctx.fill();

  // Signal lights (GO/STAY/STOP)
  const lights = [
    { x: cx + 48 * scale, y: cy - 20 * scale, color: "#4caf50" },
    { x: cx + 48 * scale, y: cy + 5 * scale, color: "#ffeb3b" },
    { x: cx + 48 * scale, y: cy + 30 * scale, color: "#f44336" },
  ];
  for (const l of lights) {
    ctx.fillStyle = l.color;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  const buf = canvas.toBuffer("image/png");
  writeFileSync(outPath, buf);
  console.log(`Created ${outPath} (${size}x${size})`);
}

const publicDir = resolve(__dirname, "../public");
generateIcon(192, resolve(publicDir, "icon-192.png"));
generateIcon(512, resolve(publicDir, "icon-512.png"));
