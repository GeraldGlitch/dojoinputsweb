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

async function updateManifest() {
    console.log('--- Generando Manifiesto de Drills ---');

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
            console.log(`[ÉXITO] Encontrados ${files.length} drills para ${config.label}`);
        } catch (err) {
            console.error(`[ERROR] Error al leer ${config.folder}:`, err.message);
            manifest[key] = [];
        }
    }

    const outputPath = path.join(projectRoot, 'drills-manifest.js');
    const jsContent = `window.DRILLS_MANIFEST = ${JSON.stringify(manifest, null, 2)};`;
    fs.writeFileSync(outputPath, jsContent);
    console.log(`\nManifiesto generado con éxito en: ${outputPath}`);
}

updateManifest().catch(err => {
    console.error('Error fatal durante la generación del manifiesto:', err);
    process.exit(1);
});
