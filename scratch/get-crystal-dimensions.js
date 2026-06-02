import fs from 'fs';

function getJpgDimensions(buffer) {
  let i = 2; // Skip SOI (FF D8)
  while (i < buffer.length) {
    if (buffer[i] !== 0xFF) {
      i++;
      continue;
    }
    const marker = buffer[i + 1];
    if (marker === 0xD9 || marker === 0xDA) {
      break;
    }
    const size = buffer.readUInt16BE(i + 2);
    if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7) || 
        (marker >= 0xC9 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {
      const height = buffer.readUInt16BE(i + 5);
      const width = buffer.readUInt16BE(i + 7);
      return { width, height };
    }
    i += 2 + size;
  }
  return null;
}

const brainDir = 'C:\\Users\\ayush\\.gemini\\antigravity-ide\\brain\\7afb4b2f-37c4-44ef-9fb3-ac52e8737db3';
const files = [
  'media__1780397622535.jpg',
  'media__1780397655502.jpg',
  'media__1780397666514.jpg',
  'media__1780397675822.jpg',
  'media__1780397723126.jpg'
];

files.forEach(f => {
  const buffer = fs.readFileSync(`${brainDir}/${f}`);
  const dims = getJpgDimensions(buffer);
  console.log(`${f}: ${dims ? `${dims.width}x${dims.height}` : 'unknown'}`);
});
