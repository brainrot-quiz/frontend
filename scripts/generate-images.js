const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const generateImage = (text, filename) => {
  const canvas = createCanvas(400, 400);
  const ctx = canvas.getContext('2d');

  // 배경 색상
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 400, 400);

  // 텍스트 스타일
  ctx.font = '24px Arial';
  ctx.fillStyle = '#333333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 텍스트 줄바꿈
  const words = text.split(' ');
  let line = '';
  const lines = [];
  const maxWidth = 360;
  const lineHeight = 30;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      lines.push(line);
      line = words[i] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // 텍스트 그리기
  const y = 200 - (lines.length * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line.trim(), 200, y + i * lineHeight);
  });

  // 이미지 저장
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(filename, buffer);
};

const generateAllImages = () => {
  const outputDir = path.join(__dirname, '../public/characters');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const characters = [
    'tralalero.jpg',
    'bombardiro.jpg',
    'bombombini.jpg',
    'tripi.jpg',
    'burbaloni.jpg',
    'tracotocutulo.jpg',
    'brr.jpg',
    'trulimero.jpg',
    'bobrini.jpg',
    'frigo.jpg',
    'frulli.jpg',
    'vaca.jpg',
    'crocodildo.jpg',
    'bobritto.jpg',
    'giraffa.jpg',
    'cappuccino.jpg',
    'glorbo.jpg',
    'camelrino.jpg',
    'ambatron.jpg',
    'kaktus.jpg',
    'mic.jpg',
    'her.jpg',
    'mie.jpg',
    'mubajir.jpg',
    'beduk.jpg',
    'pat.jpg',
    'polisi.jpg',
    'ten.jpg',
    'tuyuh.jpg',
    'kur.jpg',
    'hi.jpg',
    'karpet.jpg',
    'monyet.jpg',
    'pengajak.jpg',
    'boneca.jpg',
    'tang.jpg',
    'bis.jpg',
    'tralaluli.jpg',
    'hamster.jpg',
    'pencil.jpg',
    'kaktus-taraweh.jpg',
    'pulpen.jpg',
    'pohon.jpg',
    'monyet-azan.jpg',
    'cik.jpg',
    'hor.jpg',
    'sahur.jpg',
    'bombinarium.jpg',
    'nerpinarium.jpg',
    'bobrito.jpg',
    'szczurito.jpg'
  ];

  characters.forEach(filename => {
    const name = path.basename(filename, '.jpg');
    const filepath = path.join(outputDir, filename);
    generateImage(name, filepath);
    console.log(`Generated: ${filename}`);
  });
};

generateAllImages(); 