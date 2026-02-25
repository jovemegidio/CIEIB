/* ==============================================================
   CIEIB — Gerador de recursos Android (ícones mipmap + splash)
   Converte ícones PWA para os diretórios Android res/
   Uso: node android/generate-android-res.js
   ============================================================== */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const ICONS_SRC = path.join(ROOT, 'icons');
const RES_DIR = path.join(__dirname, 'app', 'src', 'main', 'res');

// Android mipmap sizes
const MIPMAP_SIZES = {
    'mipmap-mdpi':    48,
    'mipmap-hdpi':    72,
    'mipmap-xhdpi':   96,
    'mipmap-xxhdpi':  144,
    'mipmap-xxxhdpi': 192,
};

// Drawable sizes for splash
const DRAWABLE_SIZES = {
    'drawable':       288,
    'drawable-mdpi':  288,
    'drawable-hdpi':  384,
    'drawable-xhdpi': 512,
};

async function generateResources() {
    console.log('🤖 Gerando recursos Android...\n');

    // --- Generate mipmap icons ---
    const iconSrc = path.join(ICONS_SRC, 'icon-512x512.png');
    const maskableSrc = path.join(ICONS_SRC, 'icon-maskable-512x512.png');

    if (!fs.existsSync(iconSrc)) {
        console.error('❌ icon-512x512.png não encontrado. Execute: node generate-icons.js && node generate-icons-png.js');
        process.exit(1);
    }

    // Regular icons (ic_launcher)
    for (const [folder, size] of Object.entries(MIPMAP_SIZES)) {
        const dir = path.join(RES_DIR, folder);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        await sharp(iconSrc)
            .resize(size, size)
            .png({ quality: 95 })
            .toFile(path.join(dir, 'ic_launcher.png'));

        console.log(`  ✅ ${folder}/ic_launcher.png (${size}x${size})`);
    }

    // Round icons (ic_launcher_round) - from maskable (has padding)
    const roundSrc = fs.existsSync(maskableSrc) ? maskableSrc : iconSrc;
    for (const [folder, size] of Object.entries(MIPMAP_SIZES)) {
        const dir = path.join(RES_DIR, folder);

        await sharp(roundSrc)
            .resize(size, size)
            .png({ quality: 95 })
            .toFile(path.join(dir, 'ic_launcher_round.png'));

        console.log(`  ✅ ${folder}/ic_launcher_round.png (${size}x${size})`);
    }

    // --- Generate splash drawable ---
    console.log('');
    for (const [folder, size] of Object.entries(DRAWABLE_SIZES)) {
        const dir = path.join(RES_DIR, folder);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        await sharp(iconSrc)
            .resize(size, size)
            .png({ quality: 95 })
            .toFile(path.join(dir, 'splash.png'));

        console.log(`  ✅ ${folder}/splash.png (${size}x${size})`);
    }

    // --- Generate adaptive icon foreground ---
    console.log('');
    for (const [folder, size] of Object.entries(MIPMAP_SIZES)) {
        const dir = path.join(RES_DIR, folder);
        const fgSize = Math.round(size * 1.5); // adaptive icon foreground is 108dp for 72dp icon

        await sharp(iconSrc)
            .resize(fgSize, fgSize, { fit: 'contain', background: { r: 26, g: 58, b: 92, alpha: 0 } })
            .png({ quality: 95 })
            .toFile(path.join(dir, 'ic_launcher_foreground.png'));

        console.log(`  ✅ ${folder}/ic_launcher_foreground.png (${fgSize}x${fgSize})`);
    }

    // --- Create adaptive icon XML ---
    const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/colorPrimary"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
    const anydpiDir = path.join(RES_DIR, 'mipmap-anydpi-v26');
    if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveIconXml);
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveIconXml);
    console.log('  ✅ mipmap-anydpi-v26/ic_launcher.xml (adaptive icon)');
    console.log('  ✅ mipmap-anydpi-v26/ic_launcher_round.xml (adaptive icon)');

    console.log('\n✅ Todos os recursos Android gerados com sucesso!');
}

generateResources().catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
