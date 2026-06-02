import sharp from 'sharp';

const files = [
  'media__1780395753482.jpg',
  'media__1780395773513.jpg',
  'media__1780395790931.jpg',
  'media__1780395801886.jpg'
];

const brainDir = 'C:\\Users\\ayush\\.gemini\\antigravity-ide\\brain\\7afb4b2f-37c4-44ef-9fb3-ac52e8737db3';

async function checkColors(f) {
  try {
    const filePath = `${brainDir}/${f}`;
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // 1. Avg color
    const { data: avgData } = await image
      .clone()
      .resize(10, 10, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    let rSum = 0, gSum = 0, bSum = 0;
    for (let i = 0; i < avgData.length; i += 3) {
      rSum += avgData[i];
      gSum += avgData[i+1];
      bSum += avgData[i+2];
    }
    const avgR = Math.round(rSum / 100);
    const avgG = Math.round(gSum / 100);
    const avgB = Math.round(bSum / 100);

    // 2. Center-bottom color
    const rect = {
      left: Math.round(metadata.width * 0.45),
      top: Math.round(metadata.height * 0.65),
      width: Math.round(metadata.width * 0.1),
      height: Math.round(metadata.height * 0.1)
    };
    const { data: centerData } = await image
      .clone()
      .extract(rect)
      .raw()
      .toBuffer({ resolveWithObject: true });

    let crSum = 0, cgSum = 0, cbSum = 0;
    for (let i = 0; i < centerData.length; i += 3) {
      crSum += centerData[i];
      cgSum += centerData[i+1];
      cbSum += centerData[i+2];
    }
    const centerR = Math.round(crSum / (centerData.length / 3));
    const centerG = Math.round(cgSum / (centerData.length / 3));
    const centerB = Math.round(cbSum / (centerData.length / 3));

    console.log(`${f} (${metadata.width}x${metadata.height}): Avg RGB(${avgR}, ${avgG}, ${avgB}) | Center RGB(${centerR}, ${centerG}, ${centerB})`);
  } catch (err) {
    console.error(`Error checking ${f}:`, err.message);
  }
}

async function run() {
  for (const f of files) {
    await checkColors(f);
  }
}

run();
