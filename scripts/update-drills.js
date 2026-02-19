import fs from 'fs';
import path from 'path';

const PACKS_CONFIG = {
    keyboard: {
        folder: 'comboKeyboard',
        label: 'Teclado'
    },
    xbox360: {
        folder: 'comboXbox360',
        label: 'Xbox 360'
    },
    playstation: {
        folder: 'comboPlayStation',
        label: 'PlayStation'
    },
    android: {
        folder: 'comboAndroid',
        label: 'Android'
    }
};

const projectRoot = process.cwd();
const manifest = {};

function findImage(imagesDir, baseName) {
    const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
    for (const ext of extensions) {
        const imgPath = path.join(imagesDir, baseName + ext);
        if (fs.existsSync(imgPath)) {
            return `images/${baseName + ext}`;
        }
    }
    return 'images/sample.png';
}

async function updateManifest() {
    console.log('--- Generando Manifiesto de Drills ---');

    // images folder is relative to dojohub.html
    const imagesDir = path.join(projectRoot, 'dojohub', 'images');
    let htmlGridContent = '';

    for (const [key, config] of Object.entries(PACKS_CONFIG)) {
        const folderPath = path.join(projectRoot, config.folder);

        if (!fs.existsSync(folderPath)) {
            console.warn(`[ADVERTENCIA] Carpeta no encontrada: ${config.folder}`);
            manifest[key] = [];
            continue;
        }

        try {
            const files = fs.readdirSync(folderPath)
                .filter(file => file.endsWith('.dojofiles'))
                .sort();

            manifest[key] = files;
            console.log(`[OK] ${files.length} drills para ${config.label}`);

            files.forEach(file => {
                // Strip extension to get base name, then look for matching image
                const baseName = file.slice(0, -'.dojofiles'.length);
                const imgSrc = findImage(imagesDir, baseName);
                console.log(`  ${file} -> ${imgSrc}`);

                htmlGridContent += `
      <div class="card">
        <img src="${imgSrc}">
        <p><a href="../${config.folder}/${file}" download>${file}</a></p>
      </div>`;
            });

        } catch (err) {
            console.error(`[ERROR] Error al leer ${config.folder}:`, err.message);
            manifest[key] = [];
        }
    }

    // Write manifest JS
    const outputPath = path.join(projectRoot, 'drills-manifest.js');
    fs.writeFileSync(outputPath, `window.DRILLS_MANIFEST = ${JSON.stringify(manifest, null, 2)};`);
    console.log(`\nManifiesto escrito en: ${outputPath}`);

    // Update dojohub.html
    const dojoHubPath = path.join(projectRoot, 'dojohub', 'dojohub.html');
    if (!fs.existsSync(dojoHubPath)) {
        console.warn('[ADVERTENCIA] dojohub.html no encontrado');
        return;
    }

    let htmlContent = fs.readFileSync(dojoHubPath, 'utf-8');
    // Replace everything between <div class="grid"> and </main>
    const gridRegex = /(<div class="grid">)[\s\S]*?(<\/main>)/;

    if (gridRegex.test(htmlContent)) {
        const updated = htmlContent.replace(
            gridRegex,
            `$1\n${htmlGridContent}\n    </div>\n  $2`
        );
        fs.writeFileSync(dojoHubPath, updated, 'utf-8');
        console.log('[OK] dojohub.html actualizado.');
    } else {
        console.warn('[ADVERTENCIA] No se encontró <div class="grid"> en dojohub.html');
    }
}

updateManifest().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});
