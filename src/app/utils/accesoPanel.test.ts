import { describe, expect, it } from 'vitest';
import { decidirAccesoPanel } from './accesoPanel';

describe('decidirAccesoPanel: qué hace el layout con la respuesta de /api/auth/me', () => {
  it('perfil confirmado con rol y permiso válidos: permitir', () => {
    expect(decidirAccesoPanel({ resultado: { success: true }, rolOk: true })).toBe('permitir');
  });

  it('perfil confirmado pero el rol o el permiso no alcanzan: denegado', () => {
    expect(decidirAccesoPanel({ resultado: { success: true }, rolOk: false })).toBe('denegado');
  });

  it('401: la sesión no vale, vuelve al login', () => {
    expect(decidirAccesoPanel({ resultado: { success: false, status: 401 }, rolOk: false })).toBe('login');
  });

  it('403: el backend negó el acceso de verdad', () => {
    expect(decidirAccesoPanel({ resultado: { success: false, status: 403 }, rolOk: false })).toBe('denegado');
  });

  it('503 (backend dormido o caído): reintentar, no es acceso denegado', () => {
    expect(decidirAccesoPanel({ resultado: { success: false, status: 503 }, rolOk: false })).toBe('reintentar');
  });

  it('500 y 502 también son reintentar', () => {
    expect(decidirAccesoPanel({ resultado: { success: false, status: 500 }, rolOk: false })).toBe('reintentar');
    expect(decidirAccesoPanel({ resultado: { success: false, status: 502 }, rolOk: false })).toBe('reintentar');
  });

  it('429 (demasiadas peticiones): reintentar', () => {
    expect(decidirAccesoPanel({ resultado: { success: false, status: 429 }, rolOk: false })).toBe('reintentar');
  });

  it('sin status (red, CORS, timeout o respuesta no reconocida): reintentar', () => {
    expect(decidirAccesoPanel({ resultado: { success: false }, rolOk: false })).toBe('reintentar');
  });

  it('un fallo nunca permite aunque rolOk venga en true', () => {
    expect(decidirAccesoPanel({ resultado: { success: false, status: 503 }, rolOk: true })).toBe('reintentar');
  });
});
