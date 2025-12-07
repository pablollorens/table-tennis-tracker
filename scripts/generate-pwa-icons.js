const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Brand colors
const BRAND_PRIMARY = '#2563eb';   // blue-600
const BRAND_SECONDARY = '#1d4ed8'; // blue-700

/**
 * Create a premium favicon SVG with minimalist ping pong paddle design
 * Professional, clean, and modern look
 */
const createPremiumIconSVG = (size) => {
  const radius = Math.round(size * 0.22); // iOS-style rounded corners

  // Scale factor for 100x100 base design
  const scale = size / 100;

  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Premium gradient background -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_PRIMARY}"/>
      <stop offset="100%" stop-color="${BRAND_SECONDARY}"/>
    </linearGradient>

    <!-- Subtle top highlight for depth -->
    <linearGradient id="highlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.15)"/>
      <stop offset="40%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>

    <!-- Paddle gradient - rich red -->
    <linearGradient id="paddleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </linearGradient>

    <!-- Handle gradient - warm brown -->
    <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>

    <!-- Drop shadow filter -->
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
    </filter>

    <!-- Ball shadow -->
    <filter id="ballShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0.5" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.2"/>
    </filter>
  </defs>

  <!-- Background with rounded corners (22% radius) -->
  <rect width="100" height="100" rx="22" fill="url(#bg)"/>

  <!-- Highlight overlay -->
  <rect width="100" height="50" rx="22" fill="url(#highlight)"/>

  <!-- Paddle group with shadow -->
  <g filter="url(#shadow)">
    <!-- Handle -->
    <rect x="43" y="62" width="14" height="26" rx="4" fill="url(#handleGrad)"/>
    <rect x="45" y="64" width="10" height="22" rx="3" fill="#fbbf24" opacity="0.3"/>

    <!-- Paddle face (ellipse for perspective) -->
    <ellipse cx="50" cy="42" rx="26" ry="24" fill="url(#paddleGrad)"/>

    <!-- Inner rubber surface -->
    <ellipse cx="50" cy="42" rx="22" ry="20" fill="#f87171" opacity="0.6"/>

    <!-- Subtle shine on paddle -->
    <ellipse cx="44" cy="36" rx="8" ry="6" fill="white" opacity="0.15"/>
  </g>

  <!-- Ping pong ball with motion effect -->
  <g filter="url(#ballShadow)">
    <circle cx="26" cy="24" r="9" fill="white"/>
    <circle cx="26" cy="24" r="9" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
    <!-- Subtle highlight on ball -->
    <circle cx="24" cy="22" r="3" fill="white" opacity="0.8"/>
  </g>

  <!-- Motion lines -->
  <g stroke="#fbbf24" stroke-width="2" stroke-linecap="round" opacity="0.7">
    <line x1="14" y1="18" x2="8" y2="14"/>
    <line x1="13" y1="24" x2="6" y2="24"/>
    <line x1="14" y1="30" x2="8" y2="34"/>
  </g>
</svg>`;
};

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('\n🏓 Premium PWA Icon Generator');
  console.log('='.repeat(40));
  console.log(`Brand: ${BRAND_PRIMARY} → ${BRAND_SECONDARY}`);
  console.log(`Output: ${publicDir}`);
  console.log('='.repeat(40) + '\n');

  const iconSizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 48, name: 'favicon-48x48.png' },
    { size: 64, name: 'favicon-64x64.png' },
    { size: 128, name: 'favicon-128x128.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 512, name: 'icon-512x512.png' }
  ];

  for (const { size, name } of iconSizes) {
    const svg = createPremiumIconSVG(size);
    const outputPath = path.join(publicDir, name);

    try {
      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`  ✓ Generated ${name}`);
    } catch (error) {
      console.error(`  ✗ Failed to generate ${name}:`, error.message);
    }
  }

  // Generate favicon.ico (32x32)
  try {
    const svg = createPremiumIconSVG(32);
    const icoPath = path.join(publicDir, 'favicon.ico');

    await sharp(Buffer.from(svg))
      .resize(32, 32)
      .png()
      .toFile(icoPath);

    console.log(`  ✓ Generated favicon.ico`);
  } catch (error) {
    console.error(`  ✗ Failed to generate favicon.ico:`, error.message);
  }

  // Generate favicon.svg for modern browsers
  try {
    const svg = createPremiumIconSVG(32);
    fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg);
    console.log(`  ✓ Generated favicon.svg`);
  } catch (error) {
    console.error(`  ✗ Failed to generate favicon.svg:`, error.message);
  }

  console.log('\n✅ All icons generated successfully!');
  console.log('\nFiles created:');
  console.log('  📱 PWA icons: icon-192x192.png, icon-512x512.png');
  console.log('  🍎 Apple icon: apple-touch-icon.png');
  console.log('  🌐 Favicons: favicon.ico, favicon.svg, favicon-*.png');
}

generateIcons().catch(console.error);
