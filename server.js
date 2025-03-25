const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Configuración de VAPID keys para web push
const VAPID_PUBLIC_KEY = 'BDHIKPOWzkSZWts82T2AS-Ik3A158guFWFlP71yllPDnkgWlMtTX4g2M6ZkG733tTX6_LmMihXmSsVXpyaKFxTg';
const VAPID_PRIVATE_KEY = 'TU_CLAVE_PRIVADA_VAPID_AQUI';

webpush.setVapidDetails(
    'mailto:tu@email.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Almacenamiento en memoria para las suscripciones
const subscriptions = new Set();

// Rutas API
app.post('/api/push-subscription', (req, res) => {
    const subscription = req.body;
    subscriptions.add(subscription);
    
    // Enviar notificación de bienvenida
    webpush.sendNotification(subscription, JSON.stringify({
        title: '¡Bienvenido a NutriScan!',
        body: 'Gracias por suscribirte a las notificaciones.',
        icon: '/img/icons/icon-192x192.png'
    }))
    .catch(error => console.error('Error enviando notificación:', error));
    
    res.status(201).json({ message: 'Suscripción guardada' });
});

app.post('/api/recognize-food', (req, res) => {
    // Simular reconocimiento de alimentos
    // En una implementación real, aquí se procesaría la imagen
    setTimeout(() => {
        res.json([
            {
                id: 1,
                name: 'Manzana',
                calories: 95,
                portion: '1 unidad (182g)',
                image: '/img/foods/apple.jpg'
            }
        ]);
    }, 2000);
});

app.get('/api/food/:id', (req, res) => {
    // Simular obtención de información nutricional
    // En una implementación real, esto vendría de una base de datos
    res.json({
        id: parseInt(req.params.id),
        name: 'Manzana',
        calories: 95,
        portion: '1 unidad (182g)',
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4.5,
        recommendations: 'Las manzanas son una excelente fuente de fibra y antioxidantes. Son ideales para mantener una dieta saludable.'
    });
});

app.post('/api/sync', (req, res) => {
    // Simular sincronización de datos
    // En una implementación real, aquí se guardarían los datos en una base de datos
    console.log('Datos sincronizados:', req.body);
    
    // Enviar notificación de sincronización exitosa
    subscriptions.forEach(subscription => {
        webpush.sendNotification(subscription, JSON.stringify({
            title: 'Sincronización Exitosa',
            body: 'Tus datos han sido sincronizados correctamente.',
            icon: '/img/icons/icon-192x192.png'
        }))
        .catch(error => console.error('Error enviando notificación:', error));
    });
    
    res.json({ message: 'Datos sincronizados correctamente' });
});

// Ruta para compartir imágenes
app.post('/share-target', (req, res) => {
    // Manejar la imagen compartida
    // En una implementación real, aquí se procesaría la imagen
    res.redirect('/?action=share');
});

// Ruta para el protocol handler
app.get('/', (req, res) => {
    const action = req.query.action;
    if (action) {
        // Manejar diferentes acciones según el parámetro
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 