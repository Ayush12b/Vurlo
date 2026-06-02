import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\ayush\\.gemini\\antigravity-ide\\brain\\7afb4b2f-37c4-44ef-9fb3-ac52e8737db3';
const publicDir = 'c:\\Users\\ayush\\Downloads\\vurlo-codebase\\public';

const files = [
  'media__1780394208175.jpg',
  'media__1780394236978.jpg',
  'media__1780394262047.jpg',
  'media__1780394335337.png'
];

files.forEach((file, index) => {
  const src = path.join(brainDir, file);
  const dest = path.join(publicDir, `vurlo-mistflow-temp-${index + 1}${path.extname(file)}`);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${file} to ${dest} (${fs.statSync(dest).size} bytes)`);
});
