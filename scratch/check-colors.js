import sharp from 'sharp';

const files = [
  'public/vurlo-mistflow-temp-1.jpg',
  'public/vurlo-mistflow-temp-2.jpg',
  'public/vurlo-mistflow-temp-3.jpg',
  'public/vurlo-mistflow-temp-4.png'
];

async function checkImage(f) {
  try {
    const { data, info } = await sharp(f)
      .resize(10, 10, { fit: 'fill' })
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
    console.log(`${f}: Avg RGB(${r}, ${g}, ${b})`);
  } catch (err) {
    console.error(`Error checking ${f}:`, err.message);
  }
}

async function run() {
  for (const f of files) {
    await checkImage(f);
  }
}

run();
