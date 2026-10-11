import { afterEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({
  get: vi.fn<(ruta: string, base?: unknown) => Promise<unknown>>(async () => ({ data: [] })),
}));
vi.mock('./client', () => ({ apiClient: { get, post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('./config', () => ({ getBackendBaseUrl: () => 'http://api.test' }));

import { listarPedidoItems } from './ecommerce';

afterEach(() => { get.mockClear(); });

/**
 * Las líneas de un pedido son una petición secundaria (detalle en un modal, listas de ventas): un 403
 * ahí no debe mandar toda la pantalla a /403, quien llama decide qué mostrar.
 */
describe('listarPedidoItems', () => {
  it('pide las líneas con skip403Redirect contra el backend', async () => {
    await listarPedidoItems(7);
    expect(get).toHaveBeenCalledWith('/api/pedidos/7/items', { customBase: 'http://api.test', skip403Redirect: true });
  });
});
