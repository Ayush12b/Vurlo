import fs from 'fs';

function getPngDimensions(buffer) {
  const width = buffer.readInt32BE(16);
  const height = buffer.readInt32BE(20);
  return { width, height };
}

function getJpgDimensions(buffer) {
  let i = 2; // Skip SOI (FF D8)
  while (i < buffer.length) {
    if (buffer[i] !== 0xFF) {
      // Invalid marker or padding
      i++;
      continue;
    }
    const marker = buffer[i + 1];
    if (marker === 0xD9 || marker === 0xDA) {
      // EOI or SOS, stop searching
      break;
    }
    const size = buffer.readUInt16BE(i + 2);
    // SOF markers (FF C0 to FF C3, FF C5 to FF C7, FF C9 to FF CB, FF CD to FF CF)
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

const files = [
  'public/vurlo-mistflow-temp-1.jpg',
  'public/vurlo-mistflow-temp-2.jpg',
  'public/vurlo-mistflow-temp-3.jpg',
  'public/vurlo-mistflow-temp-4.png'
];

files.forEach(f => {
  const buffer = fs.readFileSync(f);
  let dims = null;
  if (f.endsWith('.png')) {
    dims = getPngDimensions(buffer);
  } else {
    dims = getJpgDimensions(buffer);
  }
  console.log(`${f}: ${dims ? `${dims.width}x${dims.height}` : 'unknown'}`);
});
