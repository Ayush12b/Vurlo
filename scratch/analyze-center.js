import sharp from 'sharp';

const files = [
  'public/vurlo-mistflow-temp-1.jpg',
  'public/vurlo-mistflow-temp-2.jpg',
  'public/vurlo-mistflow-temp-3.jpg',
  'public/vurlo-mistflow-temp-4.png'
];

async function checkCenter(f) {
  try {
    const image = sharp(f);
    const metadata = await image.metadata();
    const width = metadata.width;
    const height = metadata.height;

    // Extract a 50x50 region in the center-bottom of the image where the humidifier body is located
    const rect = {
      left: Math.round(width * 0.45),
      top: Math.round(height * 0.65),
      width: Math.round(width * 0.1),
      height: Math.round(height * 0.1)
    };

    const { data, info } = await image
      .extract(rect)
      .raw()
      .toBuffer({ resolveWithObject: true });

    let rSum = 0, gSum = 0, bSum = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      rSum += data[i];
      gSum += data[i+1];
      bSum += data[i+2];
    }
    const pixels = data.length / info.channels;
    const r = Math.round(rSum / pixels);
    const g = Math.round(gSum / pixels);
    const b = Math.round(bSum / pixels);
    console.log(`${f}: Center RGB(${r}, ${g}, ${b})`);
  } catch (err) {
    console.error(`Error checking ${f}:`, err.message);
  }
}

async function run() {
  for (const f of files) {
    await checkCenter(f);
  }
}

run();
