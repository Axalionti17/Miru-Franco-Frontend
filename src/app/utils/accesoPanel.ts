/**
 * Qué hace un layout de panel (/admin, /operacion) con la respuesta de GET /api/auth/me.
 *
 * - `permitir`: el backend confirmó el perfil y el rol/permiso alcanza.
 * - `login`: 401, la sesión no vale.
 * - `denegado`: 403, o el perfil confirmado no tiene el rol/permiso que pide la página.
 * - `reintentar`: no se pudo comprobar (red, CORS, timeout, 429, 5xx con Neon o Render dormidos,
 *   respuesta no reconocida). No es "acceso denegado": el layout ofrece reintentar.
 */
export type AccionAccesoPanel = 'permitir' | 'login' | 'denegado' | 'reintentar';

export interface ResultadoPerfil {
  success: boolean;
  status?: number;
}

export function decidirAccesoPanel({
  resultado,
  rolOk,
}: {
  resultado: ResultadoPerfil;
  rolOk: boolean;
}): AccionAccesoPanel {
  if (resultado.success) return rolOk ? 'permitir' : 'denegado';
  if (resultado.status === 401) return 'login';
  if (resultado.status === 403) return 'denegado';
  return 'reintentar';
}
