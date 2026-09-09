import { pool, query } from '../config/db.js';

/**
 * Lista registros de una tabla con filtros opcionales.
 *
 * @param {string} tabla Nombre de la tabla.
 * @param {object} opciones { select, joins, where (string), params (array), orden }
 */
export async function listarRegistros(tabla, opciones = {}) {
  const {
    select = '*',
    joins = '',
    where = '',
    params = [],
    orden = 'id DESC',
    alias = '',
  } = opciones;

  const clausulaWhere = where ? `WHERE ${where}` : '';
  const sql = `SELECT ${select} FROM ${tabla}${alias ? ` ${alias}` : ''} ${joins} ${clausulaWhere} ORDER BY ${orden}`;
  return query(sql, params);
}

/** Obtiene un registro por su id con el SELECT indicado. */
export async function obtenerRegistro(tabla, id, select = '*', joins = '', alias = '') {
  const columnaId = alias ? `${alias}.id` : `${tabla}.id`;
  const filas = await query(
    `SELECT ${select} FROM ${tabla}${alias ? ` ${alias}` : ''} ${joins} WHERE ${columnaId} = ?`,
    [id]
  );
  return filas[0] || null;
}

/**
 * Inserta un registro y devuelve el registro creado (con joins opcionales).
 *
 * @param {string} tabla Nombre de la tabla.
 * @param {object} datos Objeto { columna: valor }.
 * @param {string} selectSelect SELECT para devolver el registro creado.
 * @param {string} joins JOINS para devolver el registro creado.
 */
export async function crearRegistro(tabla, datos, select = '*', joins = '', alias = '') {
  const columnas = Object.keys(datos);
  const valores = Object.values(datos);
  const marcadores = columnas.map(() => '?').join(', ');

  const header = await poolExecute(
    `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${marcadores})`,
    valores
  );

  return obtenerRegistro(tabla, header.insertId, select, joins, alias);
}

/**
 * Actualiza un registro por id y devuelve el registro actualizado.
 */
export async function actualizarRegistro(tabla, id, datos, select = '*', joins = '', alias = '') {
  const columnas = Object.keys(datos);
  const asignaciones = columnas.map((col) => `${col} = ?`).join(', ');
  const valores = [...Object.values(datos), id];

  await poolExecute(`UPDATE ${tabla} SET ${asignaciones} WHERE id = ?`, valores);

  return obtenerRegistro(tabla, id, select, joins, alias);
}

/** Cambia el valor de una columna booleana (por defecto desactiva con is_active = 0). */
export async function cambiarEstadoActivo(tabla, id, columna = 'is_active', valor = 0) {
  const resultado = await poolExecute(
    `UPDATE ${tabla} SET ${columna} = ? WHERE id = ?`,
    [valor, id]
  );
  return resultado.affectedRows > 0;
}

/** Elimina físicamente un registro. */
export async function eliminarRegistro(tabla, id) {
  const resultado = await poolExecute(`DELETE FROM ${tabla} WHERE id = ?`, [id]);
  return resultado.affectedRows > 0;
}

/** Verifica si existe un registro por id. */
export async function existeRegistro(tabla, id) {
  const filas = await query(`SELECT id FROM ${tabla} WHERE id = ? LIMIT 1`, [id]);
  return filas.length > 0;
}

/** Ejecuta una consulta de escritura a través del pool. */
async function poolExecute(sql, params) {
  const [resultado] = await pool.execute(sql, params);
  return resultado;
}