import { afterEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({
  get: vi.fn<(ruta: string, opciones?: unknown) => Promise<unknown>>(async () => ({ data: [] })),
}));
vi.mock('./client', () => ({ apiClient: { get, post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('./config', () => ({ getBackendBaseUrl: () => 'http://api.test' }));

import { listarDevolucionesPedido, listarEnviosPorPedido, listarFacturasPorPedido, listarHistorialPedido, listarPagosPorPedido, listarPedidoItems, listarValoracionesPedido } from './ecommerce';

afterEach(() => get.mockClear());

/**
 * El detalle de "Mis pedidos" pide también las líneas, los envíos y el historial. Con propios=true un
 * pedido ajeno responde 404 en todos (no 403, que mandaba toda la página a /403).
 */
describe('Subrecursos del pedido en el portal (propios)', () => {
  it('líneas, envíos e historial piden propios=true desde el portal', async () => {
    await listarPedidoItems(5, { propios: true });
    await listarEnviosPorPedido(5, { propios: true });
    await listarHistorialPedido(5, { propios: true });
    await listarPagosPorPedido(5, { propios: true });
    await listarFacturasPorPedido(5, { propios: true });
    await listarValoracionesPedido(5, { propios: true });
    await listarDevolucionesPedido(5, { propios: true });
    expect(get.mock.calls.map((c) => c[0])).toEqual([
      '/api/pedidos/5/items?propios=true',
      '/api/envios/pedido/5?propios=true',
      '/api/historial-estados-pedido/pedido/5?propios=true',
      '/api/pagos/pedido/5?propios=true',
      '/api/facturas/pedido/5?propios=true',
      '/api/valoraciones/pedido/5?propios=true',
      '/api/devoluciones/pedido/5?propios=true',
    ]);
  });

  it('los paneles siguen llamando sin propios', async () => {
    await listarPedidoItems(5);
    await listarEnviosPorPedido(5);
    await listarHistorialPedido(5);
    expect(get.mock.calls.map((c) => c[0])).toEqual([
      '/api/pedidos/5/items',
      '/api/envios/pedido/5',
      '/api/historial-estados-pedido/pedido/5',
    ]);
  });
});
