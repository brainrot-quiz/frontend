const fs = require('fs');
const https = require('https');
const path = require('path');

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
           .on('error', reject)
           .once('close', () => resolve(filepath));
      } else {
        res.resume();
        reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
      }
    });
  });
};

const downloadAllImages = async () => {
  const outputDir = path.join(__dirname, '../public/characters');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const imageUrls = [
    'https://raw.githubusercontent.com/your-repo/italian-brainrot/main/public/characters/tralalero.jpg',
    'https://raw.githubusercontent.com/your-repo/italian-brainrot/main/public/characters/bombardiro.jpg',
    // ... 나머지 이미지 URL들
  ];

  for (const url of imageUrls) {
    const filename = path.basename(url);
    const filepath = path.join(outputDir, filename);

    try {
      await downloadImage(url, filepath);
      console.log(`Downloaded: ${filename}`);
    } catch (error) {
      console.error(`Failed to download ${filename}:`, error.message);
    }
  }
};

downloadAllImages().catch(console.error); 