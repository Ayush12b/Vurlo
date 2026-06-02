import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\ayush\\.gemini\\antigravity-ide\\brain\\7afb4b2f-37c4-44ef-9fb3-ac52e8737db3';
const publicDir = 'c:\\Users\\ayush\\Downloads\\vurlo-codebase\\public';

// Mapping:
// 1. Galaxy Image 1 -> media__1780397622535.jpg
// 2. Galaxy Image 2 -> media__1780397655502.jpg
// 3. Galaxy Image 3 -> media__1780397666514.jpg
// 4. Galaxy Image 4 -> media__1780397675822.jpg
// 5. Moon Image 1 -> media__1780397723126.jpg

const mapping = [
  { src: 'media__1780397622535.jpg', dest: 'vurlo-galaxy-1.jpg' },
  { src: 'media__1780397655502.jpg', dest: 'vurlo-galaxy-2.jpg' },
  { src: 'media__1780397666514.jpg', dest: 'vurlo-galaxy-3.jpg' },
  { src: 'media__1780397675822.jpg', dest: 'vurlo-galaxy-4.jpg' },
  { src: 'media__1780397723126.jpg', dest: 'vurlo-moon-1.jpg' }
];

mapping.forEach(({ src, dest }) => {
  const srcPath = path.join(brainDir, src);
  const destPath = path.join(publicDir, dest);
  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied ${src} to ${destPath}`);
});
