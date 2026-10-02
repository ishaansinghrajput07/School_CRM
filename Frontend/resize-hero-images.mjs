import sharp from "sharp";
import { readdirSync } from "fs";
import path from "path";

const HERO_DIR = path.join("src", "assets", "hero");
const MAX_WIDTH = 1920;   // no screen showing this hero needs more
const QUALITY = 78;       // visually near-lossless, big size cut

const files = readdirSync(HERO_DIR).filter((f) => /\.(png|jpe?g)$/i.test(f));

for (const file of files) {
  const inputPath = path.join(HERO_DIR, file);
  const outputPath = path.join(HERO_DIR, file.replace(/\.(png|jpe?g)$/i, ".webp"));

  await sharp(inputPath)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(outputPath);

  console.log(`${file} -> ${path.basename(outputPath)}`);
}

console.log("\nDone. Once you've checked the .webp files look right, delete the original .png/.jpg files from src/assets/hero/ - HeroData.jsx already matches .webp automatically, no code change needed.");