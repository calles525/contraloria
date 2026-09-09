export function notFound(req, res) {
  res.status(404).json({ message: 'Ruta no encontrada.' });
}

export function manejarErrores(err, req, res, next) {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message, errors: err.errors });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Error interno del servidor.',
  });
}

export function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
