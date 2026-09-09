import { Router } from 'express';
import { login, usuarioActual, ubicacionUsuario } from '../controllers/auth.controller.js';
import { protegerRuta } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', protegerRuta, usuarioActual);
router.get('/ubicacion', protegerRuta, ubicacionUsuario);

export default router;
