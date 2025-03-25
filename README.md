# NutriScan PWA

Una aplicación web progresiva (PWA) para reconocimiento de alimentos y cálculo de calorías.

## Características

- 📸 Reconocimiento de alimentos mediante la cámara
- 📊 Información nutricional detallada
- 💾 Funcionamiento offline
- 🔔 Notificaciones push
- 📱 Instalable en dispositivos móviles
- 🔄 Sincronización de datos
- 🎯 Compartir imágenes
- 🔗 Protocol handler personalizado

## Requisitos

- Node.js >= 14.0.0
- npm >= 6.0.0

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/nutriscan-pwa.git
cd nutriscan-pwa
```

2. Instalar dependencias:
```bash
npm install
```

3. Generar iconos:
```bash
npm run generate-icons
```

4. Iniciar el servidor:
```bash
npm start
```

5. Abrir la aplicación en el navegador:
```
http://localhost:3000
```

## Configuración

### VAPID Keys para notificaciones push

1. Generar las claves VAPID:
```bash
npx web-push generate-vapid-keys
```

2. Actualizar las claves en `server.js`:
```javascript
const VAPID_PUBLIC_KEY = 'TU_CLAVE_PUBLICA';
const VAPID_PRIVATE_KEY = 'TU_CLAVE_PRIVADA';
```

## Estructura del Proyecto

```
nutriscan-pwa/
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── camera.js
│   └── food-recognition.js
├── img/
│   ├── icons/
│   └── foods/
├── index.html
├── manifest.json
├── service-worker.js
├── server.js
├── generate-maskable-icons.js
├── package.json
└── README.md
```

## API Endpoints

### POST /api/push-subscription
Registra una suscripción para notificaciones push.

### POST /api/recognize-food
Procesa una imagen para reconocer alimentos.

### GET /api/food/:id
Obtiene información nutricional detallada de un alimento.

### POST /api/sync
Sincroniza datos con el servidor.

## Desarrollo

### Generar APK

Para generar un APK de la aplicación:

1. Instalar PWA Builder:
```bash
npm install -g @pwabuilder/cli
```

2. Generar el APK:
```bash
pwabuilder build --platform android
```

### Tests

Para ejecutar los tests:
```bash
npm test
```

## Contribuir

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Tu Nombre - [@tutwitter](https://twitter.com/tutwitter) - email@example.com

Link del Proyecto: [https://github.com/tu-usuario/nutriscan-pwa](https://github.com/tu-usuario/nutriscan-pwa) 