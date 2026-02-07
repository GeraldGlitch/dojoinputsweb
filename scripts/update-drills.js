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
            console.log(`[ÉXITO] Encontrados ${files.length} drills para ${config.label}`);

            // Generate HTML for each drill
            files.forEach(file => {
                htmlGridContent += `
      <div class="card">
        <img src="images/sample.png">
        <p><a href="../${config.folder}/${file}" download>${file}</a></p>
      </div>`;
            });

        } catch (err) {
            console.error(`[ERROR] Error al leer ${config.folder}:`, err.message);
            manifest[key] = [];
        }
    }

    // Update Drills Manifest
    const outputPath = path.join(projectRoot, 'drills-manifest.js');
    const jsContent = `window.DRILLS_MANIFEST = ${JSON.stringify(manifest, null, 2)};`;
    fs.writeFileSync(outputPath, jsContent);
    console.log(`\nManifiesto generado con éxito en: ${outputPath}`);

    // Update DojoHub HTML
    const dojoHubPath = path.join(projectRoot, 'dojohub', 'dojohub.html');
    if (fs.existsSync(dojoHubPath)) {
        let htmlContent = fs.readFileSync(dojoHubPath, 'utf-8');
        // Search for <div class="grid"> and replace everything until </main>
        const gridRegex = /(<div class="grid">)[\s\S]*?(<\/main>)/;

        if (gridRegex.test(htmlContent)) {
            const newHtmlContent = htmlContent.replace(gridRegex, `$1\n${htmlGridContent}\n    </div>\n  $2`);
            fs.writeFileSync(dojoHubPath, newHtmlContent);
            console.log(`[ÉXITO] dojohub.html actualizado con ${htmlGridContent.split('<div class="card">').length - 1} combos.`);
        } else {
            console.warn('[ADVERTENCIA] No se encontró <div class="grid">... para reemplazar hasta </main> en dojohub.html');
        }
    } else {
        console.warn('[ADVERTENCIA] dojohub.html no encontrado');
    }
}

updateManifest().catch(err => {
    console.error('Error fatal durante la generación del manifiesto:', err);
    process.exit(1);
});
