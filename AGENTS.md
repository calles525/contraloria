# AGENTS.md — Sistema de Contraloría

Instrucciones y reglas generales que todo agente (IA o humano) debe seguir al trabajar en este proyecto.

## Idioma

- Toda la **comunicación** (comentarios en prompts, respuestas, documentación para el usuario) se hace en **español**.
- El **código fuente**, nombres de variables, funciones, archivos y mensajes de commit se escriben en **español o inglés** según la convención del framework, pero **preferentemente en español** salvo keywords reservadas.
- Los comentarios en el código van en **español**.
- **Prohibido usar emojis** en cualquier parte: código fuente, comentarios, mensajes de commit, documentación y respuestas. Solo texto plano.

## Stack Tecnológico (definido)

- **Frontend:** React (Vite + TypeScript).
- **Backend:** API con **Node.js + Express**.
- **Base de datos:** **MySQL** (a través de Laragon), host `localhost`, usuario `root`, sin contraseña.
- **Comunicación:** API REST Node/Express + frontend React separado.
- **Gestor de paquetes:** **pnpm** (workspace/monorepo en la raíz con `pnpm-workspace.yaml`). No usar npm para instalar.

*(Este stack puede ajustarse según las necesidades finales del sistema de contraloría.)*

## Reglas de Desarrollo

### Generales
1. **Seguridad primero:** nunca incluir credenciales, claves API o datos sensibles en el código ni en los commits. Usar variables de entorno (`.env`, `.env.example`).
2. **No romper funcionalidad existente:** antes de modificar algo, revisar qué lo usa. Usar `git status` y `git diff` antes de comitear.
3. **Seguir las convenciones del framework:** usar las herramientas estándar de Express/Node.js y de React (hooks, componentes funcionales).
4. **Escribir código limpio y legible:** nombres descriptivos, funciones cortas, sin lógica duplicada.
5. **Gestor de paquetes:** usar **pnpm** siempre (nunca npm). Comandos desde la raíz: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm typecheck`. Los subproyectos se gestionan con `pnpm --filter <paquete>`.

### React / Frontend
- Usar **TypeScript** y componentes funcionales con hooks.
- No usar clases (salvo casos excepcionales).
- Mantener los componentes en la carpeta correspondiente y con nombres en `PascalCase`.
- Las llamadas a la API se centralizan en servicios/`api` y se manejan errores de forma consistente.

### Estilo UI — OBLIGATORIO: Template TailAdmin
> Regla **obligatoria, de máxima prioridad.** Todo el frontend del sistema DEBE guiarse por el estilo, componentes y convenciones del template admin.

**Ubicación de la referencia:** `C:\laragon\www\templante-admin\tailadmin-free-tailwind-dashboard-template-main`

1. **Base visual:** Tailwind CSS, maquetación por **partials/reutilizables** (sidebar, header, cards, tablas, modales, formularios en `src/partials/`).
2. **Design tokens TailAdmin que SIEMPRE se usan:**
   - Cards: `rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]` + padding `p-4/p-5 md:p-6`.
   - Navbar/Sidebar: estructura con `border-gray-200 dark:border-gray-800`, fondo `bg-white` / `dark:bg-black`, ancho sidebar `w-[290px]` colapsable a `lg:w-[90px]`.
   - Tipografía: `text-theme-sm`, `text-theme-xs`, `text-title-sm`, `text-title-md`, `text-title-lg`; colores `text-gray-800 dark:text-white/90` (títulos), `text-gray-500 dark:text-gray-400` (subtítulos/meta).
   - Botones: `rounded-lg` con `px-4 py-2.5 text-theme-sm font-medium`, `shadow-theme-xs`, variantes claro/oscuro.
   - Layout de página: `p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6` y grid `grid grid-cols-12 gap-4 md:gap-6`.
   - Estados de color: usar la paleta TailAdmin (`brand`, `success-*`, `error-*`, `warning-*`, `gray-*`, `white/[0.03]`).
   - Iconos SVG inline (reutilizar los del template); compatibilidad **dark mode** en cada componente.
3. **Antes de crear cualquier componente nuevo**, revisar en el template si ya existe un partial equivalente y **reutilizarlo/adaptarlo**.
4. **No mezclar** con otros sistemas de estilos ni inventar alternativas visuales distintas al template. Si algo no existe en el template, seguir el patrón visual consistente con el que ya hay.
5. Toda página nueva debe integrarse como el resto: sidebar a la izquierda, header arriba, contenido en `<main>` con el contenedor de grids descrito.

### Node.js / Express (API Backend)
- Usar **rutas Express** organizadas por módulos/recursos y separar la lógica (controladores y servicios).
- Conectar a MySQL con `mysql2` y usar `dotenv` para las variables de entorno.
- Configuración de conexión en un módulo central; **sin credenciales hardcodeadas**.
- Validar siempre la entrada de datos en el backend.
- Manejar errores de forma consistente (middleware de errores).
- No exponer datos sensibles (contraseñas, tokens) en las respuestas de la API.

### Base de Datos (MySQL)
- Conexión de desarrollo: host `localhost`, usuario `root`, **sin contraseña** (Laragon).
- Nombrar tablas en **plural** y en inglés (ej: `users`, `expedientes`).
- Definir índices en las columnas más consultadas.
- Usar migraciones/herramientas de esquema (ej: un sistema simple de migraciones o SQL versionado) para versionar la BD.

## Git

- **No hacer commit** salvo que el usuario lo solicite explícitamente.
- Mensajes de commit descriptivos y concisos en **español**, siguiendo el estilo del repositorio.
- No usar `--force`, `--amend` ni reescribir historial salvo petición explícita.
- Revisar siempre `git status` y `git diff` antes de comitear.

## Flujo de trabajo al recibir una tarea

1. **Preguntar/confirmar el alcance** si la tarea es ambigua.
2. **Explorar el código existente** relevante antes de escribir.
3. **Implementar** de forma incremental, verificando con pruebas.
4. **Verificar** con los comandos de lint/typecheck/test del proyecto cuando existan.
5. **No explicar más de lo necesario** en la respuesta; ser conciso.

## Pruebas

- Las pruebas se escriben conforme se definan (Vitest/Testing Library para React, y el framework de pruebas que se elija para Node/Express).
- Antes de dar una tarea por terminada, ejecutar las pruebas existentes si las hay.

## Registrar cambios de reglas

- Si surge una convención nueva de forma recurrente, proponerla para agregarla a este archivo.
- Actualizar este documento solo con la aprobación del usuario o cuando sea parte de la tarea.
