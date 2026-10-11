import { describe, expect, it, vi } from 'vitest';
import { cargarDetallePedido, MENSAJE_ITEMS_NO_DISPONIBLES, mensajeErrorDetallePedido } from './detallePedido';

const pedido = { id: 7, estado: 'pagado' };
const items = [{ id: 1, cantidad: 2 }];

describe('cargarDetallePedido: el pedido manda, las líneas son secundarias', () => {
  it('con todo bien devuelve el pedido y sus líneas, sin error', async () => {
    const r = await cargarDetallePedido(7, {
      obtenerPedido: async () => pedido,
      listarPedidoItems: async () => items,
    });
    expect(r).toEqual({ pedido, items, errorItems: null });
  });

  it('si las líneas fallan (403, 5xx, red) se conserva el pedido y se da el mensaje para el modal', async () => {
    const err = Object.assign(new Error('Acceso denegado'), { status: 403 });
    const r = await cargarDetallePedido(7, {
      obtenerPedido: async () => pedido,
      listarPedidoItems: async () => { throw err; },
    });
    expect(r).toEqual({ pedido, items: [], errorItems: MENSAJE_ITEMS_NO_DISPONIBLES });
  });

  it('si el pedido falla, el error sube a quien llama', async () => {
    const listar = vi.fn(async () => items);
    await expect(
      cargarDetallePedido(7, {
        obtenerPedido: async () => { throw new Error('No se pudo cargar el pedido'); },
        listarPedidoItems: listar,
      }),
    ).rejects.toThrow('No se pudo cargar el pedido');
  });

  it('pide las dos cosas en paralelo con el mismo id', async () => {
    const obtener = vi.fn(async () => pedido);
    const listar = vi.fn(async () => items);
    await cargarDetallePedido(7, { obtenerPedido: obtener, listarPedidoItems: listar });
    expect(obtener).toHaveBeenCalledWith(7);
    expect(listar).toHaveBeenCalledWith(7);
  });
});

describe('mensajeErrorDetallePedido', () => {
  it('un 404 (pedido ajeno o inexistente) se explica en español, sin el texto crudo del servidor', () => {
    const e = Object.assign(new Error('Not Found'), { status: 404 });
    expect(mensajeErrorDetallePedido(e)).toBe('No encontramos ese pedido.');
  });

  it('otros errores conservan su mensaje', () => {
    expect(mensajeErrorDetallePedido(new Error('Sin conexión'))).toBe('Sin conexión');
    expect(mensajeErrorDetallePedido('raro')).toBe('Error al cargar');
  });
});
