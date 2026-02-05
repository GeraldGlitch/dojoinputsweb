import fs from 'fs';
import path from 'path';

const PACKS_CONFIG = {
    keyboard: {
        folder: 'comboKeyboard',
        label: 'Keyboard'
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
    console.log('--- Generating Drills Manifest ---');

    for (const [key, config] of Object.entries(PACKS_CONFIG)) {
        const folderPath = path.join(projectRoot, config.folder);

        if (!fs.existsSync(folderPath)) {
            console.warn(`[WARNING] Folder not found: ${config.folder}`);
            manifest[key] = [];
            continue;
        }

        try {
            const files = fs.readdirSync(folderPath)
                .filter(file => file.endsWith('.dojofiles'))
                .sort();

            manifest[key] = files;
            console.log(`[SUCCESS] Found ${files.length} drills for ${config.label}`);
        } catch (err) {
            console.error(`[ERROR] Failed to read ${config.folder}:`, err.message);
            manifest[key] = [];
        }
    }

    const outputPath = path.join(projectRoot, 'drills-manifest.js');
    const jsContent = `window.DRILLS_MANIFEST = ${JSON.stringify(manifest, null, 2)};`;
    fs.writeFileSync(outputPath, jsContent);
    console.log(`\nManifest generated successfully at: ${outputPath}`);
}

updateManifest().catch(err => {
    console.error('Fatal error during manifest generation:', err);
    process.exit(1);
});
