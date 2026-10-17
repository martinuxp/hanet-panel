# HaNet Panel

Panel web para HNT, Admin, Profesor, Directiva y CEE (Firebase `hanet-edu`).

- UI: componentes Arc (uiarc.dev) en `src/components/arc/`. Antes de tocar UI lee `.claude/skills/arc/SKILL.md`.
- Colores: solo los de HaNet. La paleta vive en `src/index.css` (`--hn-*`) y se mapea a los roles de Arc ahí mismo. No uses hex sueltos en componentes; usa los roles (`--accent`, `--surface`, ...).
- La acción principal (`Button variant="primary"`) es rosa HaNet `#EF2274`, a diferencia del Arc original.
- El sidebar es el de shadcn (`src/components/ui/sidebar.tsx`); sus variables apuntan a los roles de Arc.
- El panel llama Cloud Functions existentes; nunca escribe Firestore directo.
- Repo público: nunca subas secretos ni datos de estudiantes. Deploys de hosting solo con OK del dueño.
