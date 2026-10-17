# HaNet Panel

Panel web para administración y docentes de HaNet. Usa el mismo proyecto de
Firebase que la app (`hanet-edu`, repo `martinuxp/hanetcl`).

## Stack

- Vite + React + TypeScript
- TanStack Router con rutas por archivo (`src/routes`, el árbol se genera en `src/routeTree.gen.ts`)
- Tailwind v4 + shadcn/ui como base de componentes
- [Arc](https://uiarc.dev) para componentes animados (charts, rango de fechas, command palette).
  Se instalan con el mismo CLI de shadcn; solo componentes gratis (MIT).
- Colores HaNet en `src/index.css`, sacados de `hanetcl/constants/design-tokens.ts`. Solo modo oscuro.

## Desarrollo

```bash
npm install
npm run dev
```

## Roles

El acceso depende de los claims `role` y `courseId` del token, los mismos que
usa la app (los sincroniza `syncMyClaims` en `hanetcl/functions`). Los roles
se asignan en el Panel HNT. `Estudiante` no entra al panel.

| Ruta             | HNT | Admin | Profesor | Directiva | CEE |
| ---------------- | --- | ----- | -------- | --------- | --- |
| `/`              | ✓   | ✓     | ✓        | ✓         | ✓   |
| `/instituciones` | ✓   |       |          |           |     |
| `/calendario`    | ✓   | ✓     | ✓        | ✓         | ✓   |

El panel no escribe directo en Firestore: usa las funciones del backend
(`admin*` para HNT, `verifyCalendarEvent` para Profesor), igual que la app.

## Deploy

Firebase Hosting, sitio `hanet-panel` del proyecto `hanet-edu` (hay que crearlo
una vez con `firebase hosting:sites:create hanet-panel`).

```bash
npm run build
firebase deploy --only hosting
```
