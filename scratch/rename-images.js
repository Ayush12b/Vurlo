import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\ayush\\.gemini\\antigravity-ide\\brain\\7afb4b2f-37c4-44ef-9fb3-ac52e8737db3';
const publicDir = 'c:\\Users\\ayush\\Downloads\\vurlo-codebase\\public';

// Mapping:
// 1. Cozy desk setup (MAIN COVER IMAGE) -> media__1780394208175.jpg
// 2. Minimal shelf aesthetic setup -> media__1780394262047.jpg
// 3. Product with box (trust image) -> media__1780394236978.jpg
// 4. Warm candle aesthetic scene -> media__1780394335337.png

const mapping = [
  { src: 'media__1780394208175.jpg', dest: 'vurlo-mistflow-1.jpg' },
  { src: 'media__1780394262047.jpg', dest: 'vurlo-mistflow-2.jpg' },
  { src: 'media__1780394236978.jpg', dest: 'vurlo-mistflow-3.jpg' },
  { src: 'media__1780394335337.png', dest: 'vurlo-mistflow-4.png' }
];

mapping.forEach(({ src, dest }) => {
  const srcPath = path.join(brainDir, src);
  const destPath = path.join(publicDir, dest);
  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied ${src} to ${destPath}`);
});

// Clean up temporary files
const tempFiles = [
  'vurlo-mistflow-temp-1.jpg',
  'vurlo-mistflow-temp-2.jpg',
  'vurlo-mistflow-temp-3.jpg',
  'vurlo-mistflow-temp-4.png'
];

tempFiles.forEach(f => {
  const p = path.join(publicDir, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Cleaned up temporary file ${p}`);
  }
});
