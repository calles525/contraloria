import { Router } from 'express';
import { protegerRuta } from '../middlewares/auth.middleware.js';
import { requierePermiso } from '../middlewares/permisos.middleware.js';
import { subirArchivoRequerimiento } from '../middlewares/subirArchivo.middleware.js';
import { solicitudesController } from '../controllers/solicitudes.controller.js';

const router = Router();

// Todas las rutas de solicitudes requieren autenticación.
router.use(protegerRuta);

// Lectura: la pueden ver quienes crean solicitudes y quienes las gestionan.
router.get(
  '/solicitudes',
  requierePermiso('crear_solicitudes', 'gestionar_solicitudes'),
  solicitudesController.listar
);
router.get(
  '/solicitudes/:id',
  requierePermiso('crear_solicitudes', 'gestionar_solicitudes'),
  solicitudesController.obtener
);

// Escritura de solicitudes: solo quienes tienen permiso de creación.
router.post('/solicitudes', requierePermiso('crear_solicitudes'), solicitudesController.crear);
router.put(
  '/solicitudes/:id',
  requierePermiso('crear_solicitudes'),
  solicitudesController.actualizar
);
router.delete(
  '/solicitudes/:id',
  requierePermiso('crear_solicitudes'),
  solicitudesController.eliminar
);

// Acciones de gestión: solo quienes tienen permiso de gestión.
router.post(
  '/solicitudes/:id/procesar',
  requierePermiso('gestionar_solicitudes'),
  solicitudesController.procesar
);
router.post(
  '/solicitudes/:id/regresar',
  requierePermiso('gestionar_solicitudes'),
  solicitudesController.regresar
);
router.post(
  '/solicitudes/:id/rechazar',
  requierePermiso('gestionar_solicitudes'),
  solicitudesController.rechazar
);
router.post(
  '/solicitudes/:id/validar',
  requierePermiso('gestionar_solicitudes'),
  solicitudesController.validar
);
router.post(
  '/solicitudes/:id/notas',
  requierePermiso('gestionar_solicitudes'),
  solicitudesController.agregarNota
);

// Documentos requeridos: subir y quitar son gestión; descargar lo permite cualquiera que vea.
router.post(
  '/solicitudes/:id/requerimientos/:requerimientoId/archivo',
  requierePermiso('gestionar_solicitudes'),
  subirArchivoRequerimiento,
  solicitudesController.subirArchivo
);
router.get(
  '/solicitudes/:id/requerimientos/:requerimientoId/archivo',
  requierePermiso('crear_solicitudes', 'gestionar_solicitudes'),
  solicitudesController.descargarArchivo
);
router.delete(
  '/solicitudes/:id/requerimientos/:requerimientoId/archivo',
  requierePermiso('gestionar_solicitudes'),
  solicitudesController.quitarArchivo
);

export default router;