// Archivo SVG para generar iconos de diferentes tamaños
// Este es un archivo SVG simple con un icono de una manzana verde
// que representa la aplicación NutriScan

const fs = require('fs');
const sharp = require('sharp');

// Crear un SVG básico para el icono
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#4CAF50" rx="128" ry="128"/>
  <circle cx="256" cy="256" r="180" fill="#388E3C"/>
  <path d="M256 120 C200 120 160 180 160 256 C160 332 200 392 256 392 C312 392 352 332 352 256 C352 180 312 120 256 120 Z" fill="#FFFFFF"/>
  <circle cx="256" cy="256" r="120" fill="#4CAF50"/>
  <path d="M256 176 C220 176 196 212 196 256 C196 300 220 336 256 336 C292 336 316 300 316 256 C316 212 292 176 256 176 Z" fill="#C8E6C9"/>
  <circle cx="220" cy="200" r="15" fill="#FFFFFF"/>
</svg>
`;

// Tamaños de iconos requeridos para PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Función para generar iconos
async function generateIcons() {
  try {
    // Guardar el SVG original
    fs.writeFileSync('icon.svg', svgIcon);
    
    // Generar iconos PNG en diferentes tamaños
    for (const size of iconSizes) {
      await sharp('icon.svg')
        .resize(size, size)
        .png()
        .toFile(`img/icons/icon-${size}x${size}.png`);
      
      console.log(`Generado icono de ${size}x${size}`);
    }
    
    // Generar icono para notificaciones
    await sharp('icon.svg')
      .resize(72, 72)
      .png()
      .toFile('img/icons/badge-72x72.png');
    
    // Generar icono para acceso directo
    await sharp('icon.svg')
      .resize(96, 96)
      .png()
      .toFile('img/icons/scan-96x96.png');
    
    console.log('Todos los iconos generados correctamente');
  } catch (error) {
    console.error('Error generando iconos:', error);
  }
}

// Ejecutar la generación de iconos
generateIcons();
