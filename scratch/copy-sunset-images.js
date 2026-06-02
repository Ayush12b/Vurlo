import fs from 'fs';
import path from 'path';

const brainDir = 'C:/Users/ayush/.gemini/antigravity-ide/brain/7afb4b2f-37c4-44ef-9fb3-ac52e8737db3';
const publicDir = 'c:/Users/ayush/Downloads/vurlo-codebase/public';

const images = [
  { src: 'media__1780412765418.jpg', dest: 'sunset-lamp-1.jpg' },
  { src: 'media__1780412799931.jpg', dest: 'sunset-lamp-2.jpg' },
  { src: 'media__1780412944361.jpg', dest: 'sunset-lamp-3.jpg' },
  { src: 'media__1780412962860.jpg', dest: 'sunset-lamp-4.jpg' }
];

images.forEach(({ src, dest }) => {
  const srcPath = path.join(brainDir, src);
  const destPath = path.join(publicDir, dest);
  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied ${src} to ${destPath}`);
});
