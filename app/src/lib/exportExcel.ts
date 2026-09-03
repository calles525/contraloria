// Helpers de exportación (CSV, Excel, PDF) y generación de PDF de solicitud.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ESTADOS, PRIORIDADES, TIPOS } from '../lib/constants';
import type { Solicitud } from '../lib/types';

interface FilaExportacion {
  numeroSolicitud: string;
  titulo: string;
  tipo: string;
  prioridad: string;
  estado: string;
  origen: string;
  destino: string;
  solicitante: string;
  fecha: string;
}

function aFilas(lista: Solicitud[]): FilaExportacion[] {
  return lista.map((s) => ({
    numeroSolicitud: s.numeroSolicitud,
    titulo: s.titulo,
    tipo: TIPOS[s.tipo] ?? s.tipo,
    prioridad: PRIORIDADES[s.prioridad] ?? s.prioridad,
    estado: ESTADOS[s.estado] ?? s.estado,
    origen: s.departamentoOrigenNombre,
    destino: s.departamentoDestinoNombre,
    solicitante: s.creadorNombre,
    fecha: new Date(s.fechaCreacion).toLocaleDateString('es-VE'),
  }));
}

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportarCSV(lista: Solicitud[]) {
  const columnas = 'N°, Título, Tipo, Prioridad, Estado, Origen, Destino, Solicitante, Fecha\n';
  const cuerpo = aFilas(lista)
    .map((f) =>
      [f.numeroSolicitud, f.titulo, f.tipo, f.prioridad, f.estado, f.origen, f.destino, f.solicitante, f.fecha]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n');
  descargar(new Blob(['\uFEFF' + columnas + cuerpo], { type: 'text/csv;charset=utf-8' }), 'solicitudes.csv');
}

export function exportarExcel(lista: Solicitud[]) {
  const ws = XLSX.utils.json_to_sheet(aFilas(lista));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes');
  XLSX.writeFile(wb, 'solicitudes.xlsx');
}

export function exportarPDF(lista: Solicitud[]) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text('Solicitudes Interdepartamentales', 14, 16);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-VE')}`, 14, 22);
  autoTable(doc, {
    head: [['N°', 'Título', 'Tipo', 'Prioridad', 'Estado', 'Origen', 'Destino']],
    body: aFilas(lista).map((f) => [f.numeroSolicitud, f.titulo, f.tipo, f.prioridad, f.estado, f.origen, f.destino]),
    startY: 28,
    styles: { fontSize: 8 },
  });
  doc.save('solicitudes.pdf');
}

export function generarPDFSolicitud(sol: Solicitud) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Solicitud Interdepartamental', 14, 18);
  doc.setFontSize(11);
  let y = 30;
  const lineas: Array<[string, string]> = [
    ['Número', sol.numeroSolicitud],
    ['Título', sol.titulo],
    ['Descripción', sol.descripcion],
    ['Tipo', TIPOS[sol.tipo] ?? sol.tipo],
    ['Prioridad', PRIORIDADES[sol.prioridad] ?? sol.prioridad],
    ['Estado', ESTADOS[sol.estado] ?? sol.estado],
    ['Solicitante', sol.creadorNombre],
    ['Departamento origen', sol.departamentoOrigenNombre],
    ['Departamento destino', sol.departamentoDestinoNombre],
    ['Fecha creación', new Date(sol.fechaCreacion).toLocaleDateString('es-VE')],
  ];
  for (const [clave, valor] of lineas) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${clave}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(valor, 60, y, { maxWidth: 130 });
    y += 8;
  }
  doc.save(`${sol.numeroSolicitud}.pdf`.replace(/[\\/:*?"<>|]/g, '_'));
}
