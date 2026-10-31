const sharp = require('sharp');

async function processImage(inputPath, outputPath) {
  try {
    // We will just trim the images so their bounding box matches the rosette exactly.
    // This solves the varying sizes issue.
    await sharp(inputPath)
      .trim({ threshold: 10 }) // trim near-white borders
      .toFile(outputPath);
    console.log(`Processed ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error);
  }
}

async function main() {
  const dir = './public';
  await processImage(`${dir}/genuine_shield.png`, `${dir}/genuine_fixed.png`);
  await processImage(`${dir}/quality.png`, `${dir}/quality_fixed.png`);
  await processImage(`${dir}/returns_arrow.png`, `${dir}/returns_fixed.png`);
}

main();
