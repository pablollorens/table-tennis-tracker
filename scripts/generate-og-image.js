#!/usr/bin/env node
/**
 * Generate OG Image for social sharing
 * Creates a 1200x630 image optimized for social media
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Brand colors
const BRAND_PRIMARY = '#2563eb';
const BRAND_SECONDARY = '#1d4ed8';

const OUTPUT_DIR = path.join(__dirname, '..', 'public');

/**
 * Create OG image SVG
 */
function createOGImageSVG() {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_PRIMARY}"/>
      <stop offset="100%" stop-color="${BRAND_SECONDARY}"/>
    </linearGradient>

    <!-- Subtle pattern overlay -->
    <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.1"/>
    </pattern>

    <!-- Paddle gradient -->
    <linearGradient id="paddleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </linearGradient>

    <!-- Handle gradient -->
    <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>

    <!-- Shadow filter -->
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Dot pattern overlay -->
  <rect width="1200" height="630" fill="url(#dots)"/>

  <!-- Decorative paddle icon (top right) -->
  <g transform="translate(950, 80) scale(2)" opacity="0.15">
    <ellipse cx="50" cy="42" rx="26" ry="24" fill="white"/>
    <rect x="43" y="62" width="14" height="26" rx="4" fill="white"/>
  </g>

  <!-- Main icon (left side) -->
  <g transform="translate(100, 165)" filter="url(#shadow)">
    <!-- Icon background -->
    <rect width="300" height="300" rx="66" fill="white" opacity="0.1"/>
    <rect x="15" y="15" width="270" height="270" rx="60" fill="rgba(255,255,255,0.15)"/>

    <!-- Paddle -->
    <g transform="translate(75, 50) scale(2)">
      <!-- Handle -->
      <rect x="43" y="62" width="14" height="26" rx="4" fill="url(#handleGrad)"/>
      <rect x="45" y="64" width="10" height="22" rx="3" fill="#fbbf24" opacity="0.3"/>

      <!-- Paddle face -->
      <ellipse cx="50" cy="42" rx="26" ry="24" fill="url(#paddleGrad)"/>
      <ellipse cx="50" cy="42" rx="22" ry="20" fill="#f87171" opacity="0.6"/>
      <ellipse cx="44" cy="36" rx="8" ry="6" fill="white" opacity="0.15"/>
    </g>

    <!-- Ball -->
    <g transform="translate(75, 50) scale(2)">
      <circle cx="26" cy="24" r="9" fill="white"/>
      <circle cx="24" cy="22" r="3" fill="white" opacity="0.8"/>
    </g>

    <!-- Motion lines -->
    <g transform="translate(75, 50) scale(2)" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" opacity="0.7">
      <line x1="14" y1="18" x2="8" y2="14"/>
      <line x1="13" y1="24" x2="6" y2="24"/>
      <line x1="14" y1="30" x2="8" y2="34"/>
    </g>
  </g>

  <!-- Text content -->
  <g transform="translate(450, 200)">
    <!-- App name -->
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="800" fill="white">
      Office Pong
    </text>

    <!-- Tagline -->
    <text x="0" y="70" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="white" opacity="0.9">
      Track matches &amp; rankings
    </text>

    <!-- Features list -->
    <g transform="translate(0, 140)" fill="white" opacity="0.7" font-family="system-ui, -apple-system, sans-serif" font-size="24">
      <text x="0" y="0">✓ Live match tracking</text>
      <text x="0" y="40">✓ ELO rankings</text>
      <text x="0" y="80">✓ Stats &amp; history</text>
    </g>
  </g>

  <!-- Bottom branding bar -->
  <rect y="580" width="1200" height="50" fill="rgba(0,0,0,0.2)"/>
  <text x="60" y="612" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="white" opacity="0.8">
    table-tennis-tracker.web.app
  </text>
</svg>`;
}

async function main() {
  console.log('\n🖼️  OG Image Generator');
  console.log('='.repeat(40));

  const svg = createOGImageSVG();
  const outputPath = path.join(OUTPUT_DIR, 'og-image.png');

  try {
    await sharp(Buffer.from(svg))
      .resize(1200, 630)
      .png()
      .toFile(outputPath);

    console.log(`  ✓ Generated og-image.png (1200x630)`);
    console.log('\n✅ OG image created successfully!');
    console.log(`\nFile: ${outputPath}`);
  } catch (error) {
    console.error(`  ✗ Failed: ${error.message}`);
  }
}

main().catch(console.error);
