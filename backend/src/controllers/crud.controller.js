import {
  listarRegistros,
  obtenerRegistro,
  crearRegistro,
  actualizarRegistro,
  cambiarEstadoActivo,
  eliminarRegistro,
} from '../services/crud.service.js';
import { crearError } from '../middlewares/error.middleware.js';
import { registrarBitacora } from '../services/bitacora.service.js';

/**
 * Construye un conjunto de controladores CRUD para un recurso.
 *
 * @param {object} config Configuración del recurso:
 *   - tabla: nombre de la tabla.
 *   - alias: alias usado en consultas con joins (opcional).
 *   - selectListado / selectDetalle: SELECT para listar y detalle.
 *   - joins: cláusula JOIN para listado/detalle.
 *   - whereBase: condición fija de listado (ej: soft delete).
 *   - orden: cláusula ORDER BY del listado.
 *   - filtros: mapa { parametroQuery: columnaSql }.
 *   - columnas: columnas permitidas al crear/actualizar.
 *   - requeridos: columnas obligatorias al crear.
 *   - transformarCrear / transformarActualizar: hooks async sobre los datos.
 *   - estadoActivo: habilita el toggle de activo.
 *   - bitacoraModulo: módulo usado en la bitácora (por defecto, la tabla).
 *   - bitacoraNombre: nombre legible del recurso en la bitácora (por defecto, la tabla).
 */
export function crearControllerCrud(config) {
  const {
    tabla,
    alias = tabla,
    selectListado = `${alias}.*`,
    selectDetalle = `${alias}.*`,
    joins = '',
    whereBase = '',
    orden = `${alias}.id DESC`,
    filtros = {},
    columnas,
    requeridos = [],
    transformarCrear = async (datos) => datos,
    transformarActualizar = async (datos) => datos,
    estadoActivo = false,
    bitacoraModulo = tabla,
    bitacoraNombre = tabla,
  } = config;

  const whereId = `${alias}.id`;

  async function listar(req, res, next) {
    try {
      const condiciones = [whereBase].filter(Boolean);
      const params = [];

      for (const [parametro, columna] of Object.entries(filtros)) {
        const valor = req.query[parametro];
        if (valor !== undefined && valor !== '') {
          condiciones.push(`${columna} = ?`);
          params.push(valor);
        }
      }

      const where = condiciones.length > 0 ? condiciones.join(' AND ') : '';
      const registros = await listarRegistros(tabla, {
        select: selectListado,
        joins,
        where,
        params,
        orden,
        alias,
      });

      res.json({ data: registros });
    } catch (error) {
      next(error);
    }
  }

  async function obtener(req, res, next) {
    try {
      const registro = await obtenerRegistro(tabla, req.params.id, selectDetalle, joins, alias);

      if (!registro) {
        throw crearError(404, 'Registro no encontrado.');
      }

      res.json({ data: registro });
    } catch (error) {
      next(error);
    }
  }

  async function crear(req, res, next) {
    try {
      const datosEntrada = req.body || {};

      for (const campo of requeridos) {
        const valor = datosEntrada[campo];
        if (valor === undefined || valor === null || valor === '') {
          throw crearError(400, `El campo "${campo}" es obligatorio.`);
        }
      }

      const datos = seleccionarColumnas(datosEntrada, columnas);
      const datosFinales = await transformarCrear(datos, req.body);

      const registro = await crearRegistro(tabla, datosFinales, selectDetalle, joins, alias);

      registrarBitacora({
        usuarioId: req.user.id,
        modulo: bitacoraModulo,
        accion: 'crear',
        descripcion: `Creó un registro de ${bitacoraNombre} (#${registro.id}).`,
        detalle: { tabla, id: registro.id },
        ip: req.ip,
      });

      res.status(201).json({ data: registro });
    } catch (error) {
      next(error);
    }
  }

  async function actualizar(req, res, next) {
    try {
      const existente = await obtenerRegistro(tabla, req.params.id, 'id');
      if (!existente) {
        throw crearError(404, 'Registro no encontrado.');
      }

      const datos = seleccionarColumnas(req.body || {}, columnas);
      if (Object.keys(datos).length === 0) {
        throw crearError(400, 'No se recibieron campos para actualizar.');
      }

      const datosFinales = await transformarActualizar(datos, req.body);
      const registro = await actualizarRegistro(tabla, req.params.id, datosFinales, selectDetalle, joins, alias);

      registrarBitacora({
        usuarioId: req.user.id,
        modulo: bitacoraModulo,
        accion: 'actualizar',
        descripcion: `Actualizó el registro de ${bitacoraNombre} (#${req.params.id}).`,
        detalle: { tabla, id: Number(req.params.id) },
        ip: req.ip,
      });

      res.json({ data: registro });
    } catch (error) {
      next(error);
    }
  }

  async function cambiarEstado(req, res, next) {
    try {
      if (!estadoActivo) {
        throw crearError(404, 'Ruta no encontrada.');
      }

      const { activo } = req.body;
      const valor = activo === true || activo === 1 ? 1 : 0;

      const cambiado = await cambiarEstadoActivo(tabla, req.params.id, 'is_active', valor);
      if (!cambiado) {
        throw crearError(404, 'Registro no encontrado.');
      }

      const registro = await obtenerRegistro(tabla, req.params.id, selectDetalle, joins, alias);

      registrarBitacora({
        usuarioId: req.user.id,
        modulo: bitacoraModulo,
        accion: 'cambiar-estado',
        descripcion: `Cambió el estado de ${bitacoraNombre} (#${req.params.id}) a ${valor ? 'activo' : 'inactivo'}.`,
        detalle: { tabla, id: Number(req.params.id), activo: Boolean(valor) },
        ip: req.ip,
      });

      res.json({ data: registro });
    } catch (error) {
      next(error);
    }
  }

  async function eliminar(req, res, next) {
    try {
      const existente = await obtenerRegistro(tabla, req.params.id, 'id');
      if (!existente) {
        throw crearError(404, 'Registro no encontrado.');
      }

      await eliminarRegistro(tabla, req.params.id);

      registrarBitacora({
        usuarioId: req.user.id,
        modulo: bitacoraModulo,
        accion: 'eliminar',
        descripcion: `Eliminó el registro de ${bitacoraNombre} (#${req.params.id}).`,
        detalle: { tabla, id: Number(req.params.id) },
        ip: req.ip,
      });

      res.status(204).end();
    } catch (error) {
      // Integridad referencial: el registro está siendo usado por otros datos.
      if (error?.code === 'ER_ROW_IS_REFERENCED' || error?.code === 'ER_ROW_IS_REFERENCED_2') {
        return next(
          crearError(400, 'No se puede eliminar el registro porque está en uso por otros datos.')
        );
      }
      next(error);
    }
  }

  return { listar, obtener, crear, actualizar, eliminar, cambiarEstado };
}

/** Filtra el objeto de entrada conservando solo las columnas permitidas. */
function seleccionarColumnas(datos, columnas) {
  const resultado = {};
  for (const columna of columnas) {
    if (datos[columna] !== undefined) {
      resultado[columna] = datos[columna];
    }
  }
  return resultado;
}