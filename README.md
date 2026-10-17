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

El acceso depende del custom claim `role` del usuario en Firebase Auth
(`admin` o `docente`). Una cuenta sin rol puede iniciar sesión pero ve una
pantalla de "sin acceso". El rol lo asigna una Cloud Function del backend
(pendiente en `hanetcl/functions`); el cliente nunca lo decide.

| Ruta        | admin | docente |
| ----------- | ----- | ------- |
| `/`         | ✓     | ✓       |
| `/vinculos` | ✓     |         |
| `/eventos`  | ✓     | ✓       |

## Deploy

Firebase Hosting, sitio `hanet-panel` del proyecto `hanet-edu` (hay que crearlo
una vez con `firebase hosting:sites:create hanet-panel`).

```bash
npm run build
firebase deploy --only hosting
```
