const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgBuffer = fs.readFileSync(path.join(__dirname, 'img', 'logo.svg'));

sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'img', 'logo.png'))
    .then(() => {
        console.log('Logo convertido correctamente');
    })
    .catch(err => {
        console.error('Error convirtiendo el logo:', err);
    }); 