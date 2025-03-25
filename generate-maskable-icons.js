const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Tamaños requeridos para los iconos
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Función para generar un icono regular
async function generateIcon(size) {
    const inputPath = path.join(__dirname, 'img', 'logo.png');
    const outputDir = path.join(__dirname, 'img', 'icons');
    
    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    try {
        await sharp(inputPath)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .toFile(outputPath);
            
        console.log(`Icono regular ${size}x${size} generado correctamente`);
    } catch (error) {
        console.error(`Error generando icono ${size}x${size}:`, error);
    }
}

// Función para generar un icono maskable (con espacio extra alrededor)
async function generateMaskableIcon(size) {
    const inputPath = path.join(__dirname, 'img', 'logo.png');
    const outputDir = path.join(__dirname, 'img', 'icons');
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `maskable-${size}x${size}.png`);
    
    // Para iconos maskable, reducimos el tamaño al 75% para dejar espacio seguro alrededor
    const actualSize = Math.floor(size * 0.75);
    const padding = Math.floor((size - actualSize) / 2);
    
    try {
        // Crear un lienzo blanco con el tamaño completo
        const background = Buffer.from(`<svg><rect x="0" y="0" width="${size}" height="${size}" fill="#4CAF50"/></svg>`);
        
        await sharp(background)
            .composite([{
                input: await sharp(inputPath)
                    .resize(actualSize, actualSize, {
                        fit: 'contain',
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .toBuffer(),
                top: padding,
                left: padding
            }])
            .toFile(outputPath);
            
        console.log(`Icono maskable ${size}x${size} generado correctamente`);
    } catch (error) {
        console.error(`Error generando icono maskable ${size}x${size}:`, error);
    }
}

// Función para generar todos los iconos
async function generateAllIcons() {
    console.log('Iniciando generación de iconos...');
    
    // Generar iconos regulares
    for (const size of sizes) {
        await generateIcon(size);
    }
    
    // Generar iconos maskable
    const maskableSizes = [72, 96, 128, 192, 512];
    for (const size of maskableSizes) {
        await generateMaskableIcon(size);
    }
    
    // Generar icono de scan
    await generateScanIcon();
    
    console.log('Generación de iconos completada');
}

// Función para generar el icono de escaneo
async function generateScanIcon() {
    const size = 96;
    const outputDir = path.join(__dirname, 'img', 'icons');
    const outputPath = path.join(outputDir, `scan-${size}x${size}.png`);
    
    // Crear un SVG con un icono de cámara
    const svgBuffer = Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#4CAF50"/>
        <path d="M${size*0.3} ${size*0.35} L${size*0.3} ${size*0.3} L${size*0.7} ${size*0.3} L${size*0.7} ${size*0.35} L${size*0.7} ${size*0.65} L${size*0.7} ${size*0.7} L${size*0.3} ${size*0.7} L${size*0.3} ${size*0.65} Z" fill="white"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size*0.15}" fill="white"/>
        <rect x="${size*0.4}" y="${size*0.25}" width="${size*0.2}" height="${size*0.1}" fill="#4CAF50"/>
    </svg>
    `);
    
    try {
        await sharp(svgBuffer)
            .png()
            .toFile(outputPath);
            
        console.log(`Icono de escaneo ${size}x${size} generado correctamente`);
    } catch (error) {
        console.error(`Error generando icono de escaneo:`, error);
    }
}

// Ejecutar la generación de iconos
generateAllIcons().catch(console.error); 