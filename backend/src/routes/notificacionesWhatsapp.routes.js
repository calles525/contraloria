import { Router } from 'express';
import { protegerRuta } from '../middlewares/auth.middleware.js';
import { notificacionesWhatsappController } from '../controllers/notificacionesWhatsapp.controller.js';

const router = Router();

// La configuración de notificaciones solo requiere estar autenticado.
router.use(protegerRuta);

// Configuración de la API de Evolution (una sola fila).
router.get('/notificaciones-whatsapp/configuracion', notificacionesWhatsappController.obtenerConfiguracion);
router.put('/notificaciones-whatsapp/configuracion', notificacionesWhatsappController.guardarConfiguracion);

// Destinatarios de WhatsApp por departamento.
router.get('/notificaciones-whatsapp/departamentos', notificacionesWhatsappController.listarDepartamentos);
router.put(
  '/notificaciones-whatsapp/departamentos/:id/usuarios',
  notificacionesWhatsappController.guardarUsuariosDepartamento
);

export default router;