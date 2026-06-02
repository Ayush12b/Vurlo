import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const brainDir = 'C:/Users/ayush/.gemini/antigravity-ide/brain/7afb4b2f-37c4-44ef-9fb3-ac52e8737db3';

async function run() {
  const files = fs.readdirSync(brainDir);
  const mediaFiles = files
    .filter(f => f.startsWith('media__'))
    .map(f => {
      const p = path.join(brainDir, f);
      const stat = fs.statSync(p);
      return { name: f, time: stat.mtimeMs, size: stat.size };
    })
    .sort((a, b) => b.time - a.time);

  console.log('Latest 10 media files:');
  const top10 = mediaFiles.slice(0, 10);
  for (const f of top10) {
    const p = path.join(brainDir, f.name);
    try {
      const metadata = await sharp(p).metadata();
      console.log(`- ${f.name} | Size: ${f.size} bytes | Dim: ${metadata.width}x${metadata.height} | Time: ${new Date(f.time).toLocaleString()}`);
    } catch (e) {
      console.log(`- ${f.name} | Size: ${f.size} bytes | Err reading: ${e.message}`);
    }
  }
}

run().catch(console.error);
