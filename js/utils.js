/**
 * Utilidades genéricas: validaciones, formateo y helpers DOM.
 */

// Escape de HTML para evitar inyección al renderizar cadenas de usuario.
function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// VALIDACIONES
// ---------------------------------------------------------------------------
const Validators = {
  required: (v) => (v !== undefined && v !== null && String(v).trim() !== ''),

  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()),

  // RIF venezolano: letra (V/E/J/G) + guion + 8 dígitos + guion + dígito.
  rif: (v) => /^[VEJG]-?\d{8}-?\d$/.test(String(v).trim()),

  // Teléfono venezolano: 0XXX-XXXXXXX u opcional formato.
  phone: (v) => /^(\+?\d{1,3}[- ]?)?\(?\d{3,4}\)?[- ]?\d{7}$/.test(String(v).trim()),

  money: (v) => {
    const n = Number(String(v).replace(/[^0-9.]/g, ''));
    return !isNaN(n) && n > 0;
  },

  date: (v) => !isNaN(Date.parse(v)),
};

// Valida un TIPO_CAMPOS config (los campos específicos del paso 2).
function validarCamposEspecificos(tipo, datos) {
  const campos = TIPO_CAMPOS[tipo] || [];
  const errores = [];
  for (const c of campos) {
    const valor = datos ? datos[c.key] : undefined;
    if (!c.required) continue;
    if (!Validators.required(valor)) {
      errores.push(`El campo "${c.label}" es obligatorio.`);
    } else if (c.type === 'email' && !Validators.email(valor)) {
      errores.push(`El campo "${c.label}" debe ser un email válido.`);
    } else if (c.type === 'rif' && !Validators.rif(valor)) {
      errores.push(`El campo "${c.label}" debe tener formato RIF (ej: J-12345678-9).`);
    } else if (c.type === 'phone' && !Validators.phone(valor)) {
      errores.push(`El campo "${c.label}" debe ser un teléfono válido (ej: 0412-5551234).`);
    } else if (c.type === 'money' && !Validators.money(valor)) {
      errores.push(`El campo "${c.label}" debe ser un monto válido (> 0).`);
    }
  }
  return errores;
}

// ---------------------------------------------------------------------------
// FORMATEO
// ---------------------------------------------------------------------------
function formatearFecha(iso) {
  return DataStore.formatFecha(iso);
}

function formatearMonto(valor) {
  const n = Number(String(valor).replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return String(valor || '');
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES', maximumFractionDigits: 2 }).format(n);
}

function iniciales(nombre = '') {
  return nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

// Crea una clase de color reutilizable para badges (slate/info/...).
function badgeColor(cls) {
  const map = {
    slate: 'badge-slate',
    info: 'badge-info',
    warning: 'badge-warning',
    success: 'badge-success',
    danger: 'badge-danger',
    primary: 'badge-primary',
  };
  return map[cls] || 'badge-slate';
}

// ---------------------------------------------------------------------------
// HELPERS DOM
// ---------------------------------------------------------------------------
function $id(id) {
  return document.getElementById(id);
}

function crearEl(tag, cls, texto) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

// Construye el HTML de un <select> a partir de opciones.
function selectOptions(selectElement, opciones, valorSeleccionado) {
  selectElement.innerHTML = '';
  opciones.forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    if (String(value) === String(valorSeleccionado)) opt.selected = true;
    selectElement.appendChild(opt);
  });
}
