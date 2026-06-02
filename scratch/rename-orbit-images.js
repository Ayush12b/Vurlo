import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\ayush\\.gemini\\antigravity-ide\\brain\\7afb4b2f-37c4-44ef-9fb3-ac52e8737db3';
const publicDir = 'c:\\Users\\ayush\\Downloads\\vurlo-codebase\\public';

// Mapping:
// 1. Kids / room reaction (MAIN COVER) -> media__1780395753482.jpg
// 2. Product + projection in bedroom -> media__1780395790931.jpg
// 3. Side angle projection shot -> media__1780395773513.jpg
// 4. Close-up + color modes / remote -> media__1780395801886.jpg

const mapping = [
  { src: 'media__1780395753482.jpg', dest: 'vurlo-orbit-1.jpg' },
  { src: 'media__1780395790931.jpg', dest: 'vurlo-orbit-2.jpg' },
  { src: 'media__1780395773513.jpg', dest: 'vurlo-orbit-3.jpg' },
  { src: 'media__1780395801886.jpg', dest: 'vurlo-orbit-4.jpg' }
];

mapping.forEach(({ src, dest }) => {
  const srcPath = path.join(brainDir, src);
  const destPath = path.join(publicDir, dest);
  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied ${src} to ${destPath}`);
});
