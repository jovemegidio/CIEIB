/* ==============================================================
   CIEIB — Conversor SVG → PNG para ícones PWA
   Requer: npm install sharp --save-dev
   Uso: node generate-icons-png.js
   ============================================================== */

const fs = require('fs');
const path = require('path');

async function convert() {
    let sharp;
    try {
        sharp = require('sharp');
    } catch {
        console.error('❌ O módulo "sharp" não está instalado.');
        console.log('   Execute: npm install sharp --save-dev');
        console.log('   Depois: node generate-icons-png.js');
        process.exit(1);
    }

    const ICONS_DIR = path.join(__dirname, 'icons');
    const svgFiles = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg'));

    if (svgFiles.length === 0) {
        console.log('⚠️  Nenhum SVG encontrado. Execute primeiro: node generate-icons.js');
        process.exit(1);
    }

    console.log('🔄 Convertendo SVGs para PNG...\n');

    for (const svgFile of svgFiles) {
        const svgPath = path.join(ICONS_DIR, svgFile);
        const pngFile = svgFile.replace('.svg', '.png');
        const pngPath = path.join(ICONS_DIR, pngFile);

        // Extrair dimensões do nome do arquivo
        const sizeMatch = svgFile.match(/(\d+)x(\d+)/);
        const width = sizeMatch ? parseInt(sizeMatch[1]) : 512;
        const height = sizeMatch ? parseInt(sizeMatch[2]) : 512;

        try {
            await sharp(svgPath)
                .resize(width, height)
                .png({ quality: 95 })
                .toFile(pngPath);
            console.log(`  ✅ ${pngFile}`);
        } catch (err) {
            console.error(`  ❌ Erro ao converter ${svgFile}:`, err.message);
        }
    }

    console.log('\n✅ Conversão concluída! PNGs salvos na pasta /icons/');
}

convert();
