#!/usr/bin/env node
/**
 * Writes a small checkerboard PNG for the sample texture asset (no deps).
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../public/assets/textures");
const outPng = path.join(outDir, "checker.png");

const size = 128;
const cell = 16;
const rgba = Buffer.alloc(size * size * 4);

for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
        const checker = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0;
        const i = (y * size + x) * 4;
        rgba[i] = checker ? 220 : 40;
        rgba[i + 1] = checker ? 220 : 40;
        rgba[i + 2] = checker ? 220 : 40;
        rgba[i + 3] = 255;
    }
}

function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        c ^= buf[i];
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
    }
    return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type);
    const body = Buffer.concat([t, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
}

const raw = Buffer.alloc(size * (1 + size * 4));
let offset = 0;
for (let y = 0; y < size; y++) {
    raw[offset++] = 0;
    rgba.copy(raw, offset, y * size * 4, (y + 1) * size * 4);
    offset += size * 4;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(size, 0);
ihdr.writeUInt32BE(size, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
]);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPng, png);
console.log("Wrote", outPng);
