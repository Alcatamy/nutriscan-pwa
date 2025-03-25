# Guía de Despliegue - NutriScan PWA

Esta guía explica cómo desplegar la aplicación web progresiva (PWA) NutriScan para que pueda ser accedida desde cualquier dispositivo Android.

## Opciones de Despliegue

Hay varias formas de desplegar esta PWA. A continuación se presentan las opciones más sencillas:

### 1. GitHub Pages (Recomendado para principiantes)

GitHub Pages es un servicio gratuito que permite alojar sitios web estáticos directamente desde un repositorio GitHub.

#### Pasos:

1. Crea una cuenta en [GitHub](https://github.com/) si aún no tienes una
2. Crea un nuevo repositorio público llamado `nutriscan-pwa`
3. Sube todos los archivos de la carpeta `pwa_nutriscan` a este repositorio
4. Ve a la pestaña "Settings" del repositorio
5. Desplázate hacia abajo hasta la sección "GitHub Pages"
6. En "Source", selecciona "main" y guarda
7. Tu PWA estará disponible en: `https://tu-usuario.github.io/nutriscan-pwa/`

### 2. Netlify (Opción con más funcionalidades)

Netlify ofrece alojamiento gratuito con funciones adicionales como HTTPS automático y despliegue continuo.

#### Pasos:

1. Crea una cuenta en [Netlify](https://www.netlify.com/) (puedes usar tu cuenta de GitHub)
2. Haz clic en "New site from Git"
3. Selecciona GitHub y el repositorio donde subiste los archivos
4. Configura las opciones de construcción (para esta PWA, no se necesita ningún comando de construcción)
5. Haz clic en "Deploy site"
6. Tu PWA estará disponible en una URL como: `https://nutriscan-pwa.netlify.app`

### 3. Firebase Hosting (Opción más avanzada)

Firebase Hosting ofrece alojamiento rápido y seguro con integración a otros servicios de Google.

#### Pasos:

1. Crea una cuenta en [Firebase](https://firebase.google.com/)
2. Instala Firebase CLI: `npm install -g firebase-tools`
3. Inicia sesión: `firebase login`
4. Inicializa tu proyecto: `firebase init hosting`
5. Selecciona "Use an existing project" o crea uno nuevo
6. Configura la carpeta pública como `pwa_nutriscan`
7. Despliega: `firebase deploy --only hosting`
8. Tu PWA estará disponible en: `https://tu-proyecto.web.app`

## Instalación en Dispositivos Android

Una vez desplegada la PWA, los usuarios pueden instalarla en sus dispositivos Android siguiendo estos pasos:

1. Abrir la URL de la PWA en Chrome para Android
2. Navegar por la aplicación durante unos segundos
3. Chrome mostrará automáticamente un banner "Añadir a pantalla de inicio"
4. Alternativamente, el usuario puede tocar el menú (tres puntos) y seleccionar "Añadir a pantalla de inicio"
5. La aplicación se instalará y aparecerá como un icono en la pantalla de inicio

## Verificación del Despliegue

Para verificar que tu PWA está correctamente desplegada y es instalable:

1. Visita [Lighthouse](https://developers.google.com/web/tools/lighthouse) o usa la herramienta Lighthouse en Chrome DevTools
2. Ejecuta una auditoría de PWA en la URL de tu aplicación desplegada
3. Verifica que cumple con todos los requisitos de una PWA instalable

## Solución de Problemas Comunes

- **La PWA no se puede instalar**: Asegúrate de que estás accediendo a través de HTTPS y que el manifest.json está correctamente configurado.
- **Las imágenes no cargan**: Verifica que las rutas a las imágenes sean correctas en el entorno de producción.
- **El service worker no se registra**: Comprueba que la ruta al archivo service-worker.js sea correcta.

## Actualizaciones Futuras

Para actualizar la PWA en el futuro:

1. Modifica los archivos necesarios
2. Incrementa la versión en el service worker (cambia `CACHE_NAME = 'nutriscan-v1'` a `'nutriscan-v2'`)
3. Vuelve a desplegar siguiendo los mismos pasos que usaste inicialmente
