/* ==============================================================
   CIEIB — Gerador de Ícones PWA
   Gera ícones PNG a partir de um SVG template com logo da CIEIB
   Uso: node generate-icons.js
   ============================================================== */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, 'icons');

// Tamanhos necessários para PWA
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

// Gerar SVG do ícone CIEIB
function generateSVG(size, maskable = false) {
    const padding = maskable ? Math.round(size * 0.1) : 0;
    const innerSize = size - (padding * 2);
    const cx = size / 2;
    const cy = size / 2;
    const fontSize = Math.round(innerSize * 0.28);
    const subFontSize = Math.round(innerSize * 0.06);
    const doveSize = Math.round(innerSize * 0.22);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a3a5c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f2440;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e0c76e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c8a951;stop-opacity:1" />
    </linearGradient>
  </defs>
  ${maskable ? `<rect width="${size}" height="${size}" fill="url(#bg)" />` : `<rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="url(#bg)" />`}
  <!-- Dove icon -->
  <g transform="translate(${cx - doveSize / 2}, ${cy - innerSize * 0.32})" fill="url(#gold)">
    <path d="M${doveSize * 0.5} 0 C${doveSize * 0.3} ${doveSize * 0.1} ${doveSize * 0.1} ${doveSize * 0.3} 0 ${doveSize * 0.5} L${doveSize * 0.2} ${doveSize * 0.4} C${doveSize * 0.15} ${doveSize * 0.55} ${doveSize * 0.25} ${doveSize * 0.7} ${doveSize * 0.4} ${doveSize * 0.8} L${doveSize * 0.3} ${doveSize} L${doveSize * 0.5} ${doveSize * 0.85} L${doveSize * 0.7} ${doveSize} L${doveSize * 0.6} ${doveSize * 0.8} C${doveSize * 0.75} ${doveSize * 0.7} ${doveSize * 0.85} ${doveSize * 0.55} ${doveSize * 0.8} ${doveSize * 0.4} L${doveSize} ${doveSize * 0.5} C${doveSize * 0.9} ${doveSize * 0.3} ${doveSize * 0.7} ${doveSize * 0.1} ${doveSize * 0.5} 0Z" />
  </g>
  <!-- Text CIEIB -->
  <text x="${cx}" y="${cy + innerSize * 0.12}" font-family="'Montserrat', 'Arial', sans-serif" font-weight="800" font-size="${fontSize}" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">CIEIB</text>
  <!-- Subtitle -->
  <text x="${cx}" y="${cy + innerSize * 0.3}" font-family="'Montserrat', 'Arial', sans-serif" font-weight="400" font-size="${subFontSize}" fill="url(#gold)" text-anchor="middle" dominant-baseline="middle">CONVENÇÃO DAS IGREJAS</text>
  <text x="${cx}" y="${cy + innerSize * 0.38}" font-family="'Montserrat', 'Arial', sans-serif" font-weight="400" font-size="${subFontSize}" fill="url(#gold)" text-anchor="middle" dominant-baseline="middle">EVANGÉLICAS DO BRASIL</text>
</svg>`;
}

// Gerar SVG para screenshot placeholder
function generateScreenshotSVG(width, height, label) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a3a5c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f2440;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <text x="${width / 2}" y="${height / 2 - 30}" font-family="'Montserrat', 'Arial', sans-serif" font-weight="800" font-size="48" fill="#FFFFFF" text-anchor="middle">CIEIB</text>
  <text x="${width / 2}" y="${height / 2 + 20}" font-family="'Montserrat', 'Arial', sans-serif" font-weight="400" font-size="18" fill="#c8a951" text-anchor="middle">Convenção das Igrejas Evangélicas</text>
  <text x="${width / 2}" y="${height / 2 + 50}" font-family="'Montserrat', 'Arial', sans-serif" font-weight="400" font-size="18" fill="#c8a951" text-anchor="middle">Interdenominacional do Brasil</text>
  <text x="${width / 2}" y="${height - 40}" font-family="'Arial', sans-serif" font-weight="400" font-size="14" fill="rgba(255,255,255,0.5)" text-anchor="middle">${label}</text>
</svg>`;
}

// Criar diretório se não existir
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Gerar ícones SVG (podem ser usados diretamente ou convertidos para PNG)
console.log('🎨 Gerando ícones PWA para CIEIB...\n');

// Ícones regulares
SIZES.forEach(size => {
    const svg = generateSVG(size, false);
    const filePath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
    fs.writeFileSync(filePath, svg);
    console.log(`  ✅ icon-${size}x${size}.svg`);
});

// Ícones maskable (com padding extra para safe zone do Android)
MASKABLE_SIZES.forEach(size => {
    const svg = generateSVG(size, true);
    const filePath = path.join(ICONS_DIR, `icon-maskable-${size}x${size}.svg`);
    fs.writeFileSync(filePath, svg);
    console.log(`  ✅ icon-maskable-${size}x${size}.svg`);
});

// Screenshots placeholder
const screenshotWide = generateScreenshotSVG(1280, 720, 'cieib.org.br');
fs.writeFileSync(path.join(ICONS_DIR, 'screenshot-wide.svg'), screenshotWide);
console.log('  ✅ screenshot-wide.svg');

const screenshotMobile = generateScreenshotSVG(390, 844, 'cieib.org.br');
fs.writeFileSync(path.join(ICONS_DIR, 'screenshot-mobile.svg'), screenshotMobile);
console.log('  ✅ screenshot-mobile.svg');

console.log('\n📦 SVGs gerados com sucesso na pasta /icons/');
console.log('\n--- Para converter SVG → PNG (melhor compatibilidade) ---');
console.log('Opção 1: Instale o sharp e execute:');
console.log('  npm install sharp --save-dev');
console.log('  node generate-icons-png.js');
console.log('\nOpção 2: Use um conversor online como https://svgtopng.com');
console.log('         Converta cada SVG e salve com o mesmo nome mas extensão .png');
console.log('\n💡 Enquanto os PNGs não existirem, os SVGs serão usados como fallback.');
