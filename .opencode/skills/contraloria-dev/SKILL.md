---
name: contraloria-dev
description: Flujo de trabajo estándar para desarrollar cualquier funcionalidad en el Sistema de Contraloría (React + Node/Express). Úsalo cuando vayas a crear, modificar o corregir alguna parte del sistema (módulo, feature, componente, endpoint, ruta, migración) para seguir las convenciones del proyecto.
---

# Flujo de desarrollo del Sistema de Contraloría

Este skill define el proceso estándar a seguir al trabajar en cualquier funcionalidad del sistema.

## 1. Antes de empezar

- Revisa `AGENTS.md` y respeta sus reglas.
- Confirma el alcance con el usuario si la tarea es ambigua.
- Revisa `git status` para conocer el estado actual.

## 2. Backend (Node.js + Express)

- Conecta a **MySQL** (localhost, usuario `root`, sin contraseña) con `mysql2`.
- Organiza las **rutas Express** por módulos/recurso separando controladores y servicios.
- Configuración de conexión en un módulo central; usa `dotenv` para las variables de entorno, nunca credenciales hardcodeadas.
- Valida siempre la entrada de datos en el backend.
- Maneja errores de forma consistente con un middleware de errores.
- No expongas datos sensibles (contraseñas, tokens) en las respuestas de la API.
- Usa una herramienta de esquema/migraciones o SQL versionado para la BD.

## 3. Frontend (React + TypeScript)

- Componentes funcionales con hooks (nada de clases).
- Nombres de componentes en `PascalCase`.
- Llama a la API desde servicios centralizados.
- No mezcles sistemas de estilos.
- Maneja errores de forma consistente en toda la app.

### Estilo UI — OBLIGATORIO: Template TailAdmin (máxima prioridad)

Todo el frontend SE GUÍA por el template **TailAdmin** (`C:\laragon\www\templante-admin\tailadmin-free-tailwind-dashboard-template-main`).

- **Referencia de componentes:** revisa `src/partials/` del template (sidebar, header, table, metric-group, cards, modales, breadcrumb, botones, badges, avatares) y **reutiliza/adapta** antes de crear algo nuevo.
- **Cards:** `rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]` con `p-4/p-5 md:p-6`.
- **Tipografía:** `text-theme-sm`, `text-theme-xs`, `text-title-sm/md/lg`; títulos `text-gray-800 dark:text-white/90`, meta `text-gray-500 dark:text-gray-400`.
- **Botones:** `rounded-lg px-4 py-2.5 text-theme-sm font-medium shadow-theme-xs` con variantes claro/oscuro.
- **Layout de página:** `p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6` + `grid grid-cols-12 gap-4 md:gap-6`.
- **Sidebar/Header:** `w-[290px]` colapsable a `lg:w-[90px]`, fondos `bg-white`/`dark:bg-black`, bordes `border-gray-200 dark:border-gray-800`.
- **Paleta:** usar tokens de TailAdmin (`brand`, `success-*`, `error-*`, `warning-*`, `gray-*`, `white/[0.03]`).
- **Iconos:** SVG inline reutilizando los del template. **Dark mode** en todo componente.
- Estudia el template ANTES de escribir estilos; no inventes alternativas visuales.

## 4. Verificación

- Corre **lint** y **typecheck** del frontend: busca scripts en `package.json`.
- Corre **las pruebas** del backend Node/Express y Vitest del frontend (`npm run test` / `npm test`) si existen.
- No des la tarea por terminada sin verificar.

## 5. Finalizar

- Sé conciso en el resumen.
- No hagas commit salvo que el usuario lo pida explícitamente.
