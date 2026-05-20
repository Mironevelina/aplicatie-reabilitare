// server/src/routes/adminRoutes.ts
import { Router } from 'express';

const router = Router();

router.get('/test', (req, res) => {
    res.json({ message: "Admin routes work!" });
});

export default router;