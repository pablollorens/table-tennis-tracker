const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create a fun ping pong racket SVG
const createPingPongRacketSVG = (size) => {
  const scale = size / 512;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <!-- Background circle -->
      <circle cx="256" cy="256" r="256" fill="#2563eb"/>

      <!-- Ping pong ball with motion lines -->
      <circle cx="140" cy="120" r="35" fill="#ffffff" opacity="0.9"/>
      <circle cx="140" cy="120" r="35" fill="none" stroke="#f59e0b" stroke-width="3" opacity="0.7"/>

      <!-- Motion lines -->
      <line x1="100" y1="110" x2="70" y2="100" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
      <line x1="105" y1="125" x2="75" y2="135" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
      <line x1="110" y1="95" x2="85" y2="75" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" opacity="0.6"/>

      <!-- Racket handle -->
      <rect x="230" y="340" width="52" height="140" rx="26" fill="#d97706" stroke="#92400e" stroke-width="3"/>
      <rect x="235" y="345" width="42" height="130" rx="21" fill="#f59e0b"/>

      <!-- Grip lines on handle -->
      <line x1="238" y1="360" x2="274" y2="360" stroke="#d97706" stroke-width="2" opacity="0.5"/>
      <line x1="238" y1="380" x2="274" y2="380" stroke="#d97706" stroke-width="2" opacity="0.5"/>
      <line x1="238" y1="400" x2="274" y2="400" stroke="#d97706" stroke-width="2" opacity="0.5"/>
      <line x1="238" y1="420" x2="274" y2="420" stroke="#d97706" stroke-width="2" opacity="0.5"/>
      <line x1="238" y1="440" x2="274" y2="440" stroke="#d97706" stroke-width="2" opacity="0.5"/>

      <!-- Racket head (paddle) - outer circle -->
      <circle cx="256" cy="220" r="110" fill="#dc2626" stroke="#7f1d1d" stroke-width="4"/>

      <!-- Inner playing surface -->
      <circle cx="256" cy="220" r="95" fill="#ef4444"/>

      <!-- Rubber dimples/texture on paddle -->
      <circle cx="230" cy="195" r="6" fill="#dc2626" opacity="0.4"/>
      <circle cx="260" cy="185" r="6" fill="#dc2626" opacity="0.4"/>
      <circle cx="285" cy="205" r="6" fill="#dc2626" opacity="0.4"/>
      <circle cx="245" cy="220" r="6" fill="#dc2626" opacity="0.4"/>
      <circle cx="275" cy="215" r="6" fill="#dc2626" opacity="0.4"/>
      <circle cx="235" cy="245" r="6" fill="#dc2626" opacity="0.4"/>
      <circle cx="270" cy="240" r="6" fill="#dc2626" opacity="0.4"/>
      <circle cx="255" cy="255" r="6" fill="#dc2626" opacity="0.4"/>
      <circle cx="215" cy="220" r="6" fill="#dc2626" opacity="0.4"/>
      <circle cx="290" cy="230" r="6" fill="#dc2626" opacity="0.4"/>
      <circle cx="240" cy="210" r="6" fill="#dc2626" opacity="0.4"/>
      <circle cx="272" cy="228" r="6" fill="#dc2626" opacity="0.4"/>

      <!-- Sparkle effects -->
      <path d="M 380 150 L 385 160 L 395 165 L 385 170 L 380 180 L 375 170 L 365 165 L 375 160 Z" fill="#fbbf24" opacity="0.8"/>
      <path d="M 420 280 L 423 286 L 429 289 L 423 292 L 420 298 L 417 292 L 411 289 L 417 286 Z" fill="#fbbf24" opacity="0.8"/>
      <path d="M 90 260 L 94 268 L 102 272 L 94 276 L 90 284 L 86 276 L 78 272 L 86 268 Z" fill="#fbbf24" opacity="0.8"/>
    </svg>
  `;
};

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const iconSizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 512, name: 'icon-512x512.png' }
  ];

  for (const { size, name } of iconSizes) {
    const svg = createPingPongRacketSVG(size);
    const outputPath = path.join(publicDir, name);

    try {
      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${name}`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  // Generate favicon.ico (32x32 is standard)
  try {
    const svg = createPingPongRacketSVG(32);
    const icoPath = path.join(publicDir, 'favicon.ico');

    await sharp(Buffer.from(svg))
      .resize(32, 32)
      .png()
      .toFile(icoPath);

    console.log(`✓ Generated favicon.ico`);
  } catch (error) {
    console.error(`✗ Failed to generate favicon.ico:`, error.message);
  }

  console.log('\n🎉 All icons generated successfully!');
  console.log('📍 PWA icons: public/icon-192x192.png and public/icon-512x512.png');
  console.log('📍 Favicons: public/favicon.ico, favicon-16x16.png, favicon-32x32.png');
  console.log('📍 Apple icon: public/apple-touch-icon.png');
}

generateIcons().catch(console.error);
