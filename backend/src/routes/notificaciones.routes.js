import { Router } from 'express';
import { protegerRuta } from '../middlewares/auth.middleware.js';
import { notificacionesController } from '../controllers/notificaciones.controller.js';

const router = Router();

// Las notificaciones son personales y requieren autenticación.
router.use(protegerRuta);

// Las rutas fijas se declaran antes de las parametrizadas.
router.get('/notificaciones', notificacionesController.listar);
router.get('/notificaciones/no-leidas', notificacionesController.noLeidas);
router.post('/notificaciones/leer-todas', notificacionesController.leerTodas);
router.post('/notificaciones/:id/leida', notificacionesController.marcarUnaLeida);

export default router;