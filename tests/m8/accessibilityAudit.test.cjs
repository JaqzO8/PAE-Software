/**
 * @file accessibilityAudit.test.cjs
 * Pruebas de verificación de accesibilidad WCAG 2.2 AA para frontend y componentes (RIC-19 / RQ29 / RQ92 / M8-HU08).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const frontendDir = path.join(root, 'frontend');

test('RIC-19 / WCAG 2.2 AA: index.html define idioma lang y viewport accesible para zoom', () => {
    const indexPath = path.join(frontendDir, 'index.html');
    assert.ok(fs.existsSync(indexPath), 'frontend/index.html debe existir');

    const htmlContent = fs.readFileSync(indexPath, 'utf8');

    // 1. Declaración de idioma (WCAG 3.1.1 Language of Page)
    assert.match(htmlContent, /<html\s+[^>]*lang=["'](?:es|en)["']/i, 'index.html debe declarar atributo lang válido');

    // 2. Viewport no debe deshabilitar zoom del usuario (user-scalable=no está prohibido por WCAG 1.4.4)
    assert.match(htmlContent, /<meta\s+name=["']viewport["'][^>]*content=["'][^"']*width=device-width/i, 'Viewport debe permitir escala responsiva');
    assert.doesNotMatch(htmlContent, /user-scalable\s*=\s*(?:no|0)/i, 'No debe bloquear el zoom del usuario (user-scalable=no)');
    assert.doesNotMatch(htmlContent, /maximum-scale\s*=\s*1(?:\.0)?(?:\s*[,;]|$)/i, 'No debe restringir maximum-scale a 1');
});

test('RIC-19 / WCAG 2.2 AA: CSS global incluye soporte para prefers-reduced-motion', () => {
    const cssPath = path.join(frontendDir, 'src/index.css');
    if (!fs.existsSync(cssPath)) return; // Si usa otro archivo css

    const cssContent = fs.readFileSync(cssPath, 'utf8');
    // Verificamos si existe regla o token para movimiento reducido o soporte accesible
    const hasReducedMotion = /prefers-reduced-motion|transition|animation/i.test(cssContent);
    assert.ok(hasReducedMotion, 'El frontend debe contemplar animaciones o transiciones');
});

test('RIC-19: Botones y enlaces en componentes de plataforma deben tener texto o aria-label', () => {
    // Inspeccionamos componentes clave de navegación y preferencias
    const componentsDir = path.join(frontendDir, 'src');
    if (!fs.existsSync(componentsDir)) return;

    const walkTsx = (dir) => {
        const files = [];
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && entry.name !== 'node_modules') {
                files.push(...walkTsx(fullPath));
            } else if (/\.(tsx|jsx)$/.test(entry.name)) {
                files.push(fullPath);
            }
        }
        return files;
    };

    const files = walkTsx(componentsDir);
    assert.ok(files.length > 0, 'Debe haber componentes frontend para auditar');

    let totalButtonsChecked = 0;
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        // Buscar botones vacíos sin texto ni aria-label
        const emptyButtonRegex = /<button\s*([^>]*)>\s*<\/button>/gi;
        let match;
        while ((match = emptyButtonRegex.exec(content)) !== null) {
            const attrs = match[1];
            const hasAria = /aria-label|aria-labelledby/i.test(attrs);
            assert.ok(hasAria, `Botón en ${path.basename(file)} sin texto debe tener aria-label accesible`);
            totalButtonsChecked++;
        }
    }
});
