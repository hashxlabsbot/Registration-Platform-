import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const OUT_DIR = path.join(PUBLIC_DIR, 'email');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const targets = [
  { in: 'hero_forest_city.png', out: 'hero.jpg', width: 800 },
  { in: 'venue_exterior.png', out: 'venue.jpg', width: 600 },
  { in: 'panel_discussion.png', out: 'panel.jpg', width: 400 },
  { in: 'tech_session.png', out: 'tech.jpg', width: 400 },
  { in: 'cultural_dance.png', out: 'cultural.jpg', width: 400 },
  { in: 'presentation.png', out: 'presentation.jpg', width: 400 },
  { in: 'exhibition.png', out: 'exhibition.jpg', width: 400 },
  { in: 'gala_night.png', out: 'gala.jpg', width: 400 },
  { in: 'sustainability.png', out: 'sustainability.jpg', width: 400 }
];

async function run() {
  console.log('Starting email image optimization...');
  for (const target of targets) {
    const inPath = path.join(PUBLIC_DIR, target.in);
    const outPath = path.join(OUT_DIR, target.out);
    if (!fs.existsSync(inPath)) {
      console.warn(`Warning: Source file ${inPath} does not exist. Skipping.`);
      continue;
    }
    console.log(`Optimizing ${target.in} -> ${target.out} (width: ${target.width}px)`);
    try {
      await sharp(inPath)
        .resize(target.width)
        .jpeg({ quality: 75 })
        .toFile(outPath);
      
      const inSize = fs.statSync(inPath).size;
      const outSize = fs.statSync(outPath).size;
      console.log(`  Success! Size reduced from ${(inSize / 1024).toFixed(1)} KB to ${(outSize / 1024).toFixed(1)} KB`);
    } catch (e) {
      console.error(`  Failed to optimize ${target.in}:`, e);
    }
  }
  console.log('Image optimization complete!');
}

run().catch(err => {
  console.error('Error running image optimization:', err);
  process.exit(1);
});
