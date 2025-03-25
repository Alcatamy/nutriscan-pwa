const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Tamaños de iconos requeridos
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Función para generar un icono con padding
async function generateIcon(size, padding) {
    const inputPath = path.join(__dirname, 'img', 'logo.png');
    const outputDir = path.join(__dirname, 'img', 'icons');
    
    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    try {
        await sharp(inputPath)
            .resize(size - (padding * 2), size - (padding * 2), {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .extend({
                top: padding,
                bottom: padding,
                left: padding,
                right: padding,
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .toFile(outputPath);
            
        console.log(`Icono generado: ${outputPath}`);
    } catch (error) {
        console.error(`Error generando icono ${size}x${size}:`, error);
    }
}

// Generar todos los iconos
async function generateAllIcons() {
    console.log('Iniciando generación de iconos...');
    
    for (const size of sizes) {
        // Calcular padding basado en el tamaño
        const padding = Math.floor(size * 0.1); // 10% del tamaño
        
        await generateIcon(size, padding);
    }
    
    console.log('Generación de iconos completada.');
}

// Ejecutar la generación
generateAllIcons().catch(error => {
    console.error('Error en la generación de iconos:', error);
    process.exit(1);
}); 