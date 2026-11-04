// Modo demo: `VITE_DEMO=1 npm run build`. Sesión y backend falsos, en memoria,
// para mostrar el panel sin cuenta ni datos reales. Nunca se activa en el
// build normal, y su código queda fuera del bundle de producción.
export const DEMO = import.meta.env.VITE_DEMO === '1'
