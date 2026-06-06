import dotenv from 'dotenv';
dotenv.config(); // <-- OBLIGATORIU PE LINIA 2, înainte de orice import de rută!
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import exerciseRoutes from './routes/exerciseRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// Verificare cheie API în consolă la pornire (fără să o afișăm pe toată din motive de securitate)
if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ ATENȚIE: GEMINI_API_KEY nu este setată în fișierul .env!");
}
// Configurare Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API SakuraMotion',
            version: '1.0.0',
            description: 'Documentația endpoint-urilor pentru platforma de reabilitare',
        },
        servers: [{ url: `http://localhost:${PORT}` }],
    },
    apis: [],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// Rute API
app.use('/api/exercises', exerciseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.get('/', (req, res) => {
    res.send('Backend SakuraMotion Activ. Mergi la /api-docs pentru testare.');
});
app.listen(PORT, () => {
    console.log(`🚀 Serverul rulează pe: http://localhost:${PORT}`);
    console.log(`📝 Documentația Swagger: http://localhost:${PORT}/api-docs`);
});
