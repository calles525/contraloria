import { Router } from 'express';
import { protegerRuta } from '../middlewares/auth.middleware.js';
import { requierePermiso } from '../middlewares/permisos.middleware.js';
import { bitacoraController } from '../controllers/bitacora.controller.js';

const router = Router();

// Consultar la bitácora requiere autenticación y el permiso de bitácora.
router.use(protegerRuta);
router.use(requierePermiso('bitacora'));

router.get('/bitacora', bitacoraController.listar);
router.get('/bitacora/opciones', bitacoraController.opciones);

export default router;